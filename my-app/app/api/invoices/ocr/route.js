import { requireAuth, successResponse, errorResponse, createNotification } from "@/lib/api/routeUtils";
import { extractInvoiceWithAI } from "@/lib/aiInvoiceExtract";
import { suggestGLCode } from "@/lib/aiGlSuggest";
import User from "@/models/User";

export const runtime = "nodejs";
const CONFIDENCE_THRESHOLD = 0.75;
const FIELD_KEYS = [
  "invoiceNumber",
  "issueDate",
  "dueDate",
  "buyerName",
  "buyerEmail",
  "sellerName",
  "subtotalAmount",
  "taxAmount",
  "totalAmount",
  "currency",
  "gstin",
  "hsnCodes",
  "lineItems",
  "notes",
];

function normalizeFieldValue(fieldKey, value) {
  if (fieldKey === "lineItems") return Array.isArray(value) ? value : [];
  if (fieldKey === "hsnCodes") return Array.isArray(value) ? value : [];
  if (["subtotalAmount", "taxAmount", "totalAmount"].includes(fieldKey)) return Number(value || 0);
  return value ?? "";
}

function normalizeExtraction(extracted) {
  const normalizedValues = {};
  const ocrExtracted = {};
  const lowConfidenceFields = [];

  FIELD_KEYS.forEach((key) => {
    const raw = extracted?.[key];
    const value = raw && typeof raw === "object" && "value" in raw ? raw.value : raw;
    const confidenceRaw = raw && typeof raw === "object" && "confidence" in raw ? raw.confidence : null;
    const confidence = typeof confidenceRaw === "number" ? confidenceRaw : 0.5;
    const normalizedValue = normalizeFieldValue(key, value);

    normalizedValues[key] = normalizedValue;
    ocrExtracted[key] = { value: normalizedValue, confidence };
    if (confidence < CONFIDENCE_THRESHOLD) lowConfidenceFields.push(key);
  });

  return { normalizedValues, ocrExtracted, lowConfidenceFields };
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const isSeller = user.userType === "Seller";
  const isBuyer = user.userType === "Buyer";
  if (!isSeller && !isBuyer) {
    return errorResponse("FORBIDDEN", "Only buyers or sellers can upload invoice PDFs", 403, auth.requestId);
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const sellerId = form.get("sellerId");

    if (!file || typeof file === "string") {
      return errorResponse("VALIDATION_ERROR", "PDF file is required", 400, auth.requestId);
    }

    const fileName = String(file.name || "").toLowerCase();
    const contentType = String(file.type || "");
    if (contentType !== "application/pdf" && !fileName.endsWith(".pdf")) {
      return errorResponse("VALIDATION_ERROR", "Only PDF files are supported", 400, auth.requestId);
    }

    const bytes = await file.arrayBuffer();
    const result = await extractInvoiceWithAI(Buffer.from(bytes));

    if (!result.isInvoiceLike) {
      return errorResponse("VALIDATION_ERROR", "Please upload a valid invoice file.", 400, auth.requestId);
    }

    const overallConfidence = Number(result.overallConfidence || 0.5);
    
    // Import needed dynamically to avoid circular issues
    const { default: Invoice } = await import("@/models/Invoice");

    const extFields = result.extracted || {};
    const { normalizedValues, ocrExtracted, lowConfidenceFields } = normalizeExtraction(extFields);
    const needsReview = overallConfidence < 0.80 || lowConfidenceFields.length > 0;
    
    // Create draft invoice
    let sellerRecord = null;
    if (isBuyer) {
      if (sellerId && typeof sellerId === "string") {
        sellerRecord = await User.findById(sellerId).lean();
        if (!sellerRecord || sellerRecord.userType !== "Seller") {
          return errorResponse("VALIDATION_ERROR", "Selected seller is invalid", 400, auth.requestId);
        }
      } else {
        const candidateName = String(normalizedValues.sellerName || "").trim();
        if (!candidateName) {
          return errorResponse("VALIDATION_ERROR", "Seller selection is required", 400, auth.requestId);
        }

        const nameRegex = new RegExp(`^${escapeRegex(candidateName)}$`, "i");
        const matches = await User.find({ userType: "Seller", name: nameRegex }).limit(2).lean();
        if (matches.length === 1) {
          sellerRecord = matches[0];
        } else {
          return errorResponse("VALIDATION_ERROR", "Multiple or no sellers matched the OCR name. Please select a seller.", 400, auth.requestId);
        }
      }
    }

    const draftInvoice = await Invoice.create({
      invoiceNumber: normalizedValues.invoiceNumber || `DRAFT-${Date.now().toString().slice(-6)}`,
      sellerId: isBuyer ? sellerRecord._id : user._id,
      buyerId: isBuyer ? user._id : user._id,
      buyerCompanyId: isBuyer ? (user.companyId || user.effectiveCompanyId) : (/* Lookup needed or stay null for now */ null),
      sellerCompanyId: isBuyer ? (sellerRecord.companyId || sellerRecord.effectiveCompanyId) : (user.companyId || user.effectiveCompanyId),
      companyId: auth.companyId,
      sellerName: isBuyer ? (sellerRecord.companyName || sellerRecord.name || "Supplier") : (user.companyName || user.name || "Seller"),
      sellerEmail: isBuyer ? (sellerRecord.email || "supplier@example.com") : (user.email || "seller@example.com"),
      buyerName: isBuyer ? (user.companyName || user.name || "Buyer") : (normalizedValues.buyerName || "Unknown Buyer"),
      buyerEmail: isBuyer ? (user.email || "buyer@example.com") : (normalizedValues.buyerEmail || "buyer@example.com"),
      issueDate: normalizedValues.issueDate ? new Date(normalizedValues.issueDate) : new Date(),
      deliveryDate: new Date(),
      dueDate: normalizedValues.dueDate ? new Date(normalizedValues.dueDate) : new Date(),
      subtotalAmount: normalizedValues.subtotalAmount || 0,
      taxAmount: normalizedValues.taxAmount || 0,
      totalAmount: normalizedValues.totalAmount || 0,
      currency: normalizedValues.currency || "INR",
      status: isBuyer ? "Under Review" : (needsReview ? "draft" : "pending"),
      ocrConfidence: overallConfidence,
      ocrNeedsReview: needsReview,
      ocrExtracted,
      ocrLowConfidenceFields: lowConfidenceFields,
      lineItems: normalizedValues.lineItems || [],
    });

    if (needsReview) {
      await createNotification({
        userId: user._id.toString(),
        companyId: auth.companyId,
        type: "ocr_review_required",
        priority: "high",
        title: "Invoice needs review",
        body: `OCR extracted data with ${Math.round(overallConfidence * 100)}% confidence. Please verify the fields.`,
        entityType: "invoice",
        entityId: draftInvoice._id.toString(),
        actionUrl: isBuyer
          ? `/buyer/invoices?id=${draftInvoice._id}`
          : `/seller/invoices?tab=review&id=${draftInvoice._id}`,
      });
    }

    // Call suggestion lazily without awaiting
    suggestGLCode(draftInvoice, auth.companyId).catch(console.error);

    return successResponse(
      {
        message: result.aiPowered
          ? "Invoice extracted using AI (Gemini Vision). Review before submitting."
          : "PDF parsed using text extraction. Review before submitting.",
        sellerId: sellerRecord?._id?.toString?.() || null,
        sellerName: sellerRecord?.name || null,
        extracted: ocrExtracted,
        lowConfidenceFields,
        overallConfidence,
        rawTextPreview: result.rawTextPreview,
        aiPowered: result.aiPowered,
        aiError: result.aiError || null,
        invoiceId: draftInvoice._id.toString(),
      },
      200,
      auth.requestId,
    );
  } catch (error) {
    return errorResponse("VALIDATION_ERROR", error?.message || "Please select a valid invoice file", 400, auth.requestId);
  }
}
