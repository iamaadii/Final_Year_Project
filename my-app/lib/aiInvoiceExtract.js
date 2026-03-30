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

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "fields": {
    "invoiceNumber":   { "value": "string or null", "confidence": "number 0.0 to 1.0" },
    "issueDate":       { "value": "YYYY-MM-DD or null", "confidence": "number 0.0 to 1.0" },
    "dueDate":         { "value": "YYYY-MM-DD or null", "confidence": "number 0.0 to 1.0" },
    "buyerName":       { "value": "string or null", "confidence": "number 0.0 to 1.0" },
    "buyerEmail":      { "value": "string or null", "confidence": "number 0.0 to 1.0" },
    "sellerName":      { "value": "string or null", "confidence": "number 0.0 to 1.0" },
    "subtotalAmount":  { "value": "number or null", "confidence": "number 0.0 to 1.0" },
    "taxAmount":       { "value": "number or null", "confidence": "number 0.0 to 1.0" },
    "totalAmount":     { "value": "number or null", "confidence": "number 0.0 to 1.0" },
    "currency":        { "value": "string (INR/USD)", "confidence": "number 0.0 to 1.0" },
    "gstin":           { "value": "string or null", "confidence": "number 0.0 to 1.0" },
    "hsnCodes":        { "value": ["array of strings"], "confidence": "number 0.0 to 1.0" },
    "lineItems":       { "value": [{"description":"str", "quantity":1, "unitPrice":0, "total":0}], "confidence": "number 0.0 to 1.0" },
    "notes":           { "value": "string", "confidence": "number 0.0 to 1.0" }
  },
  "overallConfidence": "number 0.0 to 1.0"
}

If a field cannot be determined, return sensible defaults (0, "", []) for value and 0.0 for confidence. Use lower confidence when unclear.
Do not include any text outside the JSON.`;

export async function extractInvoiceWithAI(pdfBuffer) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[AI OCR] GOOGLE_GEMINI_API_KEY not set — using regex fallback");
    const result = await extractInvoiceDetailsFromPdfBuffer(pdfBuffer);
    return { 
        ...result, 
        aiPowered: false,
        overallConfidence: 0.5 
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

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
    const jsonStr = responseText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    
    let parsed = { fields: {}, overallConfidence: 0.9 };
    try {
      parsed = JSON.parse(jsonStr);
    } catch(e) {
      console.error("Failed to parse Gemini output:", jsonStr);
      throw e;
    }

    if (!parsed.fields) parsed.fields = {};
    if (!parsed.overallConfidence) parsed.overallConfidence = 0.9;

    return {
      isInvoiceLike: true,
      aiPowered: true,
      extracted: parsed.fields,
      overallConfidence: Number(parsed.overallConfidence),
      rawTextPreview: `[AI extracted — model: ${GEMINI_MODEL}]`,
    };
  } catch (err) {
    console.error("[AI OCR] Gemini extraction failed, using regex fallback:", err?.message);
    const result = await extractInvoiceDetailsFromPdfBuffer(pdfBuffer);
    return { ...result, aiPowered: false, aiError: err?.message, overallConfidence: 0.5 };
  }
}
