function pick(regex, text, fallback = "") {
  const m = text.match(regex);
  return m?.[1]?.trim() || fallback;
}

function normalizeAmount(raw) {
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[^0-9.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normalizeDate(raw) {
  if (!raw) return new Date().toISOString().slice(0, 10);
  const parts = String(raw).trim().split(/[\/\-]/).map((p) => p.trim());
  if (parts.length !== 3) return new Date().toISOString().slice(0, 10);
  let [a, b, c] = parts;
  if (c.length === 2) c = `20${c}`;
  const day = Number(a);
  const month = Number(b);
  const year = Number(c);
  if (!year || !month || !day) return new Date().toISOString().slice(0, 10);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function hasInvoiceSignals(text) {
  if (!text || text.trim().length < 40) return false;
  const checks = [
    /invoice/i,
    /bill\s*to|buyer|customer/i,
    /due\s*date/i,
    /subtotal|grand\s*total|total/i,
    /gst|tax|vat/i,
    /invoice\s*(?:no|number)?\s*[:#-]?\s*[A-Z0-9\-\/]+/i,
    /[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?/,
  ];
  const score = checks.reduce((acc, re) => (re.test(text) ? acc + 1 : acc), 0);
  return score >= 3;
}

export async function extractInvoiceDetailsFromPdfBuffer(buffer) {
  const mod = await import("pdf-parse");
  const parsePdf = mod?.default || mod;
  if (typeof parsePdf !== "function") {
    throw new Error("PDF parser module could not be initialized.");
  }

  const textResult = await parsePdf(buffer);
  const text = typeof textResult?.text === "string" ? textResult.text : "";
  const isInvoiceLike = hasInvoiceSignals(text);

  const invoiceNumberRaw = pick(
    /invoice\s*(?:no|number)?\s*[:#-]?\s*([A-Z0-9\-\/]+)/i,
    text,
    "",
  );
  const invoiceNumber = invoiceNumberRaw || `INV-${Date.now().toString().slice(-6)}`;
  const issueDateRaw =
    pick(/(?:invoice\s*date|date)\s*[:#-]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i, text) ||
    "";
  const dueDateRaw =
    pick(/due\s*date\s*[:#-]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i, text) || "";
  const buyerName = pick(/(?:bill to|buyer|customer)\s*[:#-]?\s*([^\n\r]+)/i, text, "Buyer");
  const buyerEmail = pick(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, text, "");
  const subtotalAmount = normalizeAmount(
    pick(/subtotal\s*[:#-]?\s*([A-Z]{0,3}\s?[\d,]+(?:\.\d{1,2})?)/i, text, "0"),
  );
  const taxAmount = normalizeAmount(
    pick(/(?:tax|gst|vat)\s*[:#-]?\s*([A-Z]{0,3}\s?[\d,]+(?:\.\d{1,2})?)/i, text, "0"),
  );
  const totalAmount = normalizeAmount(
    pick(/(?:grand\s*total|total)\s*[:#-]?\s*([A-Z]{0,3}\s?[\d,]+(?:\.\d{1,2})?)/i, text, "0"),
  );

  const fallbackTotal = subtotalAmount + taxAmount;
  const lineItems = [
    {
      description: "Parsed from PDF",
      quantity: 1,
      unitPrice: totalAmount || fallbackTotal || 0,
      total: totalAmount || fallbackTotal || 0,
    },
  ];

  return {
    isInvoiceLike,
    extracted: {
      invoiceNumber,
      issueDate: normalizeDate(issueDateRaw),
      dueDate: dueDateRaw ? normalizeDate(dueDateRaw) : "",
      buyerName,
      buyerEmail,
      subtotalAmount,
      taxAmount,
      totalAmount: totalAmount || fallbackTotal || 0,
      notes: "Extracted from uploaded PDF",
      lineItems,
    },
    rawTextPreview: text.slice(0, 1200),
  };
}
