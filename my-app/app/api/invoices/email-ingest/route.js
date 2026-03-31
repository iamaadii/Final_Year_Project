import crypto from "crypto";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Invoice from "@/models/Invoice";
import { extractInvoiceWithAI } from "@/lib/aiInvoiceExtract";
import { suggestGLCode } from "@/lib/aiGlSuggest";
import { createNotification, errorResponse, successResponse, writeAudit } from "@/lib/api/routeUtils";

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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function readEmailAddress(value) {
  if (!value) return "";
  if (Array.isArray(value)) {
    return normalizeEmail(value[0]?.email || value[0] || "");
  }
  if (typeof value === "object") {
    return normalizeEmail(value.email || value.address || "");
  }
  return normalizeEmail(value);
}

export async function POST(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const secret = process.env.INVOICE_INGEST_SECRET || "";
  const token = req.headers.get("x-ingest-token") || "";

  if (!secret || token !== secret) {
    return errorResponse("FORBIDDEN", "Invalid ingestion token", 403, requestId);
  }

  let payload = {};
  try {
    payload = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "Malformed payload", 400, requestId);
  }

  const fromEmail = readEmailAddress(payload?.from || payload?.sender);
  const toEmail = readEmailAddress(payload?.to || payload?.recipient);
  if (!fromEmail || !toEmail) {
    return errorResponse("VALIDATION_ERROR", "Sender and recipient emails are required", 400, requestId);
  }

  await dbConnect();

  const buyer = await User.findOne({ email: toEmail, userType: "Buyer" }).lean();
  const seller = await User.findOne({ email: fromEmail, userType: "Seller" }).lean();
  if (!buyer || !seller) {
    return errorResponse("VALIDATION_ERROR", "Buyer or seller not found for supplied emails", 400, requestId);
  }

  const attachments = Array.isArray(payload?.attachments) ? payload.attachments : [];
  const pdfs = attachments.filter((att) => {
    const name = String(att?.filename || "").toLowerCase();
    const type = String(att?.contentType || "");
    return type === "application/pdf" || name.endsWith(".pdf");
  });

  if (pdfs.length === 0) {
    return errorResponse("VALIDATION_ERROR", "No PDF attachments found", 400, requestId);
  }

  const results = [];
  for (const attachment of pdfs) {
    const encoded = String(attachment?.contentBase64 || attachment?.content || "");
    if (!encoded) continue;

    const bytes = Buffer.from(encoded, "base64");
    const extraction = await extractInvoiceWithAI(bytes);
    if (!extraction.isInvoiceLike) continue;

    const { normalizedValues, ocrExtracted, lowConfidenceFields } = normalizeExtraction(extraction.extracted || {});
    const overallConfidence = Number(extraction.overallConfidence || 0.5);
    const needsReview = overallConfidence < 0.8 || lowConfidenceFields.length > 0;

    const draftInvoice = await Invoice.create({
      invoiceNumber: normalizedValues.invoiceNumber || `EMAIL-${Date.now().toString().slice(-6)}`,
      sellerId: seller._id,
      buyerId: buyer._id,
      buyerCompanyId: buyer.companyId || buyer._id,
      sellerCompanyId: seller.companyId || seller._id,
      companyId: String(buyer.companyId || buyer._id),
      sellerName: seller.name || "Supplier",
      sellerEmail: seller.email || fromEmail,
      buyerName: buyer.name || "Buyer",
      buyerEmail: buyer.email || toEmail,
      issueDate: normalizedValues.issueDate ? new Date(normalizedValues.issueDate) : new Date(),
      deliveryDate: new Date(),
      dueDate: normalizedValues.dueDate ? new Date(normalizedValues.dueDate) : new Date(),
      subtotalAmount: normalizedValues.subtotalAmount || 0,
      taxAmount: normalizedValues.taxAmount || 0,
      totalAmount: normalizedValues.totalAmount || 0,
      currency: normalizedValues.currency || "INR",
      status: "Under Review",
      ocrConfidence: overallConfidence,
      ocrNeedsReview: needsReview,
      ocrExtracted,
      ocrLowConfidenceFields: lowConfidenceFields,
      lineItems: normalizedValues.lineItems || [],
    });

    await createNotification({
      userId: buyer._id,
      companyId: String(buyer.effectiveCompanyId || buyer.companyId || ""),
      type: "invoice_ingested",
      priority: "medium",
      title: "Invoice received via email",
      body: `Invoice ${draftInvoice.invoiceNumber} was ingested from ${fromEmail}.`,
      entityType: "invoice",
      entityId: draftInvoice._id.toString(),
      actionUrl: `/buyer/invoices?id=${draftInvoice._id}`,
    });

    await writeAudit({
      user: buyer,
      companyId: String(buyer.effectiveCompanyId || buyer.companyId || ""),
      action: "invoice_email_ingested",
      resource: "Invoice",
      resourceId: draftInvoice._id,
      details: { fromEmail, subject: payload?.subject || "" },
      req,
    });

    suggestGLCode(draftInvoice, String(buyer.effectiveCompanyId || buyer.companyId || "")).catch(() => undefined);

    results.push({ invoiceId: draftInvoice._id.toString(), confidence: overallConfidence });
  }

  if (results.length === 0) {
    return errorResponse("VALIDATION_ERROR", "No valid invoice attachments found", 400, requestId);
  }

  return successResponse({ received: true, count: results.length, invoices: results }, 200, requestId);
}
