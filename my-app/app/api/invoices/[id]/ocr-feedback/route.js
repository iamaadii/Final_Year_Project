import { z } from "zod";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import OcrFeedback from "@/models/OcrFeedback";
import { requireAuth, parseBody, successResponse, errorResponse, ensureCompanyAccess } from "@/lib/api/routeUtils";

const FeedbackSchema = z.object({
  correctedFields: z.record(z.any()).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = params;
  const parsed = await parseBody(req, FeedbackSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  await dbConnect();

  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) {
    return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  }

  if (!ensureCompanyAccess(invoice.companyId, auth.companyId)) {
    return errorResponse("FORBIDDEN", "Invoice does not belong to your company", 403, auth.requestId);
  }

  if (String(invoice.sellerId) !== String(auth.user._id)) {
    return errorResponse("FORBIDDEN", "Only the seller can submit OCR feedback", 403, auth.requestId);
  }

  const feedback = await OcrFeedback.create({
    invoiceId: invoice._id,
    companyId: invoice.companyId,
    userId: auth.user._id,
    originalExtracted: invoice.ocrExtracted,
    correctedFields: parsed.data.correctedFields || null,
    notes: parsed.data.notes || "",
  });

  invoice.ocrNeedsReview = false;
  invoice.ocrReviewedAt = new Date();
  invoice.auditTrail.push({
    action: "ocr_feedback_submitted",
    userId: auth.user._id,
    userName: auth.user.name || auth.user.email,
    timestamp: new Date(),
    details: "OCR corrections submitted",
  });
  await invoice.save();

  return successResponse({ feedbackId: String(feedback._id) }, 200, auth.requestId);
}
