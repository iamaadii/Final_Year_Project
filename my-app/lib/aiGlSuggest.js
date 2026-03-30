import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-1.5-flash";

export async function suggestGLCode(invoice, companyId) {
  if (!invoice || !companyId) return null;

  const { default: ChartOfAccount } = await import("@/models/ChartOfAccount");
  const { default: Invoice } = await import("@/models/Invoice");

  const invoiceDoc = typeof invoice.save === "function" ? invoice : await Invoice.findById(invoice._id);
  if (!invoiceDoc) return null;

  if (invoiceDoc.glCodeSuggestion) {
    return { accountCode: invoiceDoc.glCodeSuggestion, confidence: invoiceDoc.glCodeConfidence ?? 0.7 };
  }

  const accounts = await ChartOfAccount.find({ companyId, accountType: "expense", isActive: true }).lean();
  if (!accounts.length) return null;

  const hsnCodes = Array.isArray(invoiceDoc.hsnCodes) ? invoiceDoc.hsnCodes : [];
  for (const hsn of hsnCodes) {
    const match = accounts.find((a) => Array.isArray(a.hsnCodes) && a.hsnCodes.includes(hsn));
    if (match?.accountCode) {
      invoiceDoc.glCodeSuggestion = match.accountCode;
      invoiceDoc.glCodeConfidence = 0.92;
      await invoiceDoc.save();
      return { accountCode: match.accountCode, confidence: 0.92 };
    }
  }

  const previousInvoice = await Invoice.findOne({
    sellerId: invoiceDoc.sellerId,
    companyId,
    glCodeSuggestion: { $ne: null },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (previousInvoice?.glCodeSuggestion) {
    invoiceDoc.glCodeSuggestion = previousInvoice.glCodeSuggestion;
    invoiceDoc.glCodeConfidence = 0.75;
    await invoiceDoc.save();
    return { accountCode: previousInvoice.glCodeSuggestion, confidence: 0.75 };
  }

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `
Given these invoice line items: ${JSON.stringify(invoiceDoc.lineItems || [])}
And this chart of accounts: ${JSON.stringify(accounts.map((a) => ({ code: a.accountCode, name: a.accountName })))}
Which account code is the most appropriate for this expense?
Return ONLY valid JSON: { "accountCode": "XXXX", "confidence": 0.0 }
`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, ""));

    if (!parsed?.accountCode) return null;

    const normalizedCode = String(parsed.accountCode).trim();
    const confidence = Math.min(1, Math.max(0, Number(parsed.confidence || 0.6)));

    invoiceDoc.glCodeSuggestion = normalizedCode;
    invoiceDoc.glCodeConfidence = confidence;
    await invoiceDoc.save();

    return { accountCode: normalizedCode, confidence };
  } catch (error) {
    console.error("GL Code suggestion failed", error);
    return null;
  }
}
