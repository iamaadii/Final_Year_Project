import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { requireAuth, parseBody, successResponse, errorResponse } from "@/lib/api/routeUtils";

const DraftSchema = z.object({
  reason: z.string().min(1),
});

export async function POST(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const parsed = await parseBody(req, DraftSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id).lean();
  if (!invoice || invoice.isDeleted) {
    return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  }

  const isBuyer = String(invoice.buyerId) === String(user._id);
  if (!isBuyer) {
    return errorResponse("FORBIDDEN", "Only buyers can draft disputes", 403, auth.requestId);
  }

  try {
    const { reason } = parsed.data;

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return successResponse(
        { text: `Dear ${invoice.sellerName},\n\nWe are reaching out to dispute Invoice ${invoice.invoiceNumber}. Reason: ${reason}\n\nPlease resolve this at your earliest convenience.\n\nRegards,\n${user.name}` },
        200,
        auth.requestId,
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Write a professional yet firm dispute message for Invoice ${invoice.invoiceNumber} to ${invoice.sellerName}. The reason for the dispute is: ${reason}. Keep it concise and polite.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return successResponse({ text }, 200, auth.requestId);
  } catch (error) {
    return errorResponse("SERVER_ERROR", error?.message || "Failed to generate draft", 500, auth.requestId);
  }
}
