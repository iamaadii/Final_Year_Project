/**
 * Gemini Vision Invoice OCR
 * Supervision: Self-supervised (pre-trained LLM) + RLHF
 * Learning: Batch (frozen model, no incremental learning)
 * Approach: Model-based (learned representations)
 * 
 * Falls back to regex parser if Gemini API key not configured.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractInvoiceDetailsFromPdfBuffer } from "@/lib/pdfInvoiceExtract";

const GEMINI_MODEL = "gemini-1.5-flash";

const EXTRACTION_PROMPT = `You are an expert invoice parser. Extract structured data from this invoice document.

Return ONLY a valid JSON object with these exact fields (no markdown, no explanation):
{
  "invoiceNumber": "string (invoice number/ID)",
  "invoiceDate": "YYYY-MM-DD (invoice issue date)",
  "dueDate": "YYYY-MM-DD (payment due date, empty string if not found)",
  "buyerName": "string (bill-to company/person name)",
  "buyerEmail": "string (buyer email if present, else empty)",
  "sellerName": "string (sold-by / from company name)",
  "subtotalAmount": number (subtotal before tax),
  "taxAmount": number (total tax/GST/VAT amount),
  "totalAmount": number (grand total),
  "currency": "INR or USD or relevant currency code",
  "gstin": "string (GST number if found, else empty)",
  "hsnCodes": ["array of HSN/SAC codes if present"],
  "lineItems": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "total": number
    }
  ],
  "notes": "string (any payment terms or notes found)"
}

If a field cannot be determined, use sensible defaults (0 for numbers, "" for strings, [] for arrays).
Do not include any text outside the JSON.`;

/**
 * Extract invoice details from a PDF buffer using Gemini Vision.
 * Falls back to regex parser if GOOGLE_GEMINI_API_KEY is not set.
 */
export async function extractInvoiceWithAI(pdfBuffer) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  // Fallback to regex parser if no API key
  if (!apiKey) {
    console.warn("[AI OCR] GOOGLE_GEMINI_API_KEY not set — using regex fallback");
    const result = await extractInvoiceDetailsFromPdfBuffer(pdfBuffer);
    return { ...result, aiPowered: false };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Convert PDF buffer to base64
    const base64Pdf = pdfBuffer.toString("base64");

    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Pdf,
        },
      },
    ]);

    const responseText = result.response.text().trim();

    // Strip any markdown code fences if present
    const jsonStr = responseText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const extracted = JSON.parse(jsonStr);

    // Normalize dates
    const issueDate = extracted.invoiceDate || new Date().toISOString().slice(0, 10);
    const dueDate = extracted.dueDate || "";
    const invoiceNumber = extracted.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;

    // Validate totals
    const subtotalAmount = Math.abs(Number(extracted.subtotalAmount) || 0);
    const taxAmount = Math.abs(Number(extracted.taxAmount) || 0);
    const totalAmount = Math.abs(Number(extracted.totalAmount) || subtotalAmount + taxAmount);

    return {
      isInvoiceLike: true,
      aiPowered: true,
      extracted: {
        invoiceNumber,
        issueDate,
        dueDate,
        buyerName: extracted.buyerName || "Buyer",
        buyerEmail: extracted.buyerEmail || "",
        sellerName: extracted.sellerName || "",
        subtotalAmount,
        taxAmount,
        totalAmount,
        currency: extracted.currency || "INR",
        gstin: extracted.gstin || "",
        hsnCodes: Array.isArray(extracted.hsnCodes) ? extracted.hsnCodes : [],
        lineItems: Array.isArray(extracted.lineItems) && extracted.lineItems.length > 0
          ? extracted.lineItems.map((item) => ({
              description: String(item.description || "Service"),
              quantity: Math.abs(Number(item.quantity) || 1),
              unitPrice: Math.abs(Number(item.unitPrice) || 0),
              total: Math.abs(Number(item.total) || 0),
            }))
          : [{ description: "Extracted from PDF", quantity: 1, unitPrice: totalAmount, total: totalAmount }],
        notes: extracted.notes || "Extracted from uploaded PDF via AI",
      },
      rawTextPreview: `[AI extracted — model: ${GEMINI_MODEL}]`,
    };
  } catch (err) {
    console.error("[AI OCR] Gemini extraction failed, using regex fallback:", err?.message);
    // Graceful fallback
    const result = await extractInvoiceDetailsFromPdfBuffer(pdfBuffer);
    return { ...result, aiPowered: false, aiError: err?.message };
  }
}
