import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import User from "@/models/User";
import {
  requireAuth,
  errorResponse,
} from "@/lib/api/routeUtils";

function drawLine(page, text, x, y, size = 10, options = {}) {
  page.drawText(String(text || ""), {
    x,
    y,
    size,
    font: options.font || page.docFont,
    color: options.color || rgb(0.07, 0.1, 0.18),
  });
}

function wrapText(text, maxWidth, font, fontSize) {
  if (!text) return [""];
  const words = String(text).split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

export async function GET(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    await dbConnect();
    const invoice = await Invoice.findById(id).lean();

    if (!invoice || invoice.isDeleted) {
      return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
    }

    // Permission check
    const sameCompany = String(invoice.companyId || "") === auth.companyId || 
                        String(invoice.buyerCompanyId || "") === auth.companyId || 
                        String(invoice.sellerCompanyId || "") === auth.companyId;

    const emailMatch = (invoice.buyerEmail && invoice.buyerEmail.toLowerCase() === auth.user.email.toLowerCase()) ||
                       (invoice.sellerEmail && invoice.sellerEmail.toLowerCase() === auth.user.email.toLowerCase());

    if (!sameCompany && !emailMatch) {
      return errorResponse("FORBIDDEN", "Invoice does not belong to your company", 403, auth.requestId);
    }

    // Fetch full profiles for addresses
    const [sellerUser, buyerUser] = await Promise.all([
      User.findById(invoice.sellerId).lean(),
      User.findById(invoice.buyerId).lean()
    ]);

    const sellerAddress = sellerUser?.settings?.billingAddress || "No address provided.";
    const buyerAddress = buyerUser?.settings?.billingAddress || "No address provided.";

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595, 842]);
    page.docFont = font;

    // Header Branding
    page.drawRectangle({ x: 0, y: 760, width: 595, height: 82, color: rgb(0.06, 0.11, 0.18) });
    
    // Stylized Logo (N3 Box)
    page.drawRectangle({ x: 32, y: 785, width: 35, height: 35, color: rgb(0.11, 0.73, 0.69) });
    page.drawText("N3", { x: 39, y: 795, size: 18, font: fontBold, color: rgb(1,1,1) });
    
    page.drawText("NEXUS THREE", { x: 75, y: 805, size: 20, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Platform for Enterprise Financing", { x: 75, y: 790, size: 10, font, color: rgb(0.8, 0.8, 0.8) });
    
    page.drawText("TAX INVOICE", { x: 440, y: 800, size: 16, font: fontBold, color: rgb(1, 1, 1) });

    let y = 730;
    const leftX = 32;
    const rightX = 330;

    // Metadata Row 1
    page.drawText(`Invoice #: ${invoice.invoiceNumber || "-"}`, { x: leftX, y, size: 11, font: fontBold });
    page.drawText(`Issue Date: ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("en-IN") : "-"}`, { x: rightX, y, size: 10, font });
    y -= 16;
    page.drawText(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-IN") : "-"}`, { x: leftX, y, size: 10, font });
    page.drawText(`Currency: ${invoice.currency || "INR"}`, { x: rightX, y, size: 10, font });

    y -= 35;
    // Party Headers
    page.drawText("SELLER / SHIP FROM", { x: leftX, y, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    page.drawText("BUYER / SHIP TO", { x: rightX, y, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    
    y -= 18;
    // Party Details
    page.drawText(invoice.sellerName || "-", { x: leftX, y, size: 11, font: fontBold });
    page.drawText(invoice.buyerName || "-", { x: rightX, y, size: 11, font: fontBold });
    
    y -= 14;
    page.drawText(`GSTIN: ${invoice.sellerGstin || "-"}`, { x: leftX, y, size: 10, font });
    page.drawText(`GSTIN: ${invoice.buyerGstin || "-"}`, { x: rightX, y, size: 10, font });
    
    y -= 14;
    // Address Wrapping
    const sellerAddrLines = wrapText(sellerAddress, 240, font, 9);
    const buyerAddrLines = wrapText(buyerAddress, 240, font, 9);
    const maxAddrLines = Math.max(sellerAddrLines.length, buyerAddrLines.length);
    
    for (let i = 0; i < maxAddrLines; i++) {
        if (sellerAddrLines[i]) drawLine(page, sellerAddrLines[i], leftX, y, 9);
        if (buyerAddrLines[i]) drawLine(page, buyerAddrLines[i], rightX, y, 9);
        y -= 12;
    }

    y -= 20;
    // Table Header
    page.drawRectangle({ x: leftX, y, width: 531, height: 24, color: rgb(0.06, 0.11, 0.18) });
    page.drawText("Description", { x: leftX + 8, y: y + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("HSN/SAC", { x: 260, y: y + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Qty", { x: 340, y: y + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Unit Price", { x: 395, y: y + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Total Amount", { x: 485, y: y + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });

    y -= 20;
    const items = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
    for (const item of items) {
      drawLine(page, item.description || "-", leftX + 8, y, 9);
      drawLine(page, item.hsnCode || "-", 260, y, 9);
      drawLine(page, (item.quantity ?? 1).toLocaleString(), 340, y, 9);
      drawLine(page, Number(item.unitPrice || 0).toLocaleString("en-IN"), 395, y, 9);
      drawLine(page, Number(item.total || 0).toLocaleString("en-IN"), 485, y, 9);
      y -= 16;
      if (y < 100) break; // Basic pagination prevention
    }

    y -= 20;
    // Totals Section
    const totalX = 400;
    const valX = 500;
    
    drawLine(page, "Subtotal:", totalX, y, 10);
    drawLine(page, Number(invoice.subtotalAmount || 0).toLocaleString("en-IN"), valX, y, 10);
    y -= 14;
    drawLine(page, "Tax (GST):", totalX, y, 10);
    drawLine(page, Number(invoice.taxAmount || 0).toLocaleString("en-IN"), valX, y, 10);
    y -= 14;
    if (invoice.tdsAmount > 0) {
        drawLine(page, "TDS:", totalX, y, 10);
        drawLine(page, Number(invoice.tdsAmount || 0).toLocaleString("en-IN"), valX, y, 10);
        y -= 14;
    }
    
    page.drawRectangle({ x: totalX - 5, y: y - 5, width: 170, height: 22, color: rgb(0.9, 0.95, 0.95) });
    page.drawText("Grand Total:", { x: totalX, y, size: 11, font: fontBold });
    page.drawText(`INR ${Number(invoice.totalAmount || 0).toLocaleString("en-IN")}`, { x: valX - 10, y, size: 11, font: fontBold });

    // IRN / QR if applicable
    if (invoice.eInvoiceStatus === "submitted" && invoice.eInvoiceIRN) {
      y -= 40;
      page.drawText("GST IRN", { x: leftX, y, size: 10, font: fontBold });
      y -= 14;
      page.drawText(String(invoice.eInvoiceIRN), { x: leftX, y, size: 7, font });

      if (invoice.eInvoiceQRCode && String(invoice.eInvoiceQRCode).startsWith("data:image")) {
        try {
          const base64 = String(invoice.eInvoiceQRCode).split(",")[1] || "";
          const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
          const png = await pdfDoc.embedPng(bytes);
          page.drawImage(png, { x: 480, y: y - 20, width: 80, height: 80 });
        } catch { /* ignore */ }
      }
    }

    // Signature Area
    y = 120;
    page.drawText("Authorized Signatory", { x: 440, y, size: 10, font: fontBold });
    page.drawLine({ start: { x: 420, y: y + 40 }, end: { x: 550, y: y + 40 }, thickness: 1 });
    page.drawText("For " + String(invoice.sellerName).toUpperCase(), { x: 420, y: y + 55, size: 8, font });

    // Footer
    page.drawRectangle({ x: 0, y: 0, width: 595, height: 40, color: rgb(0.06, 0.11, 0.18) });
    page.drawText("Generated by Nexus Three | Secure Trade Financing Ecosystem | nexusthree.io", { 
        x: 32, 
        y: 15, 
        size: 9, 
        font, 
        color: rgb(1, 1, 1) 
    });

    const bytes = await pdfDoc.save();
    const filename = `TAX-INV-${invoice.invoiceNumber || "invoice"}.pdf`;

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${filename}`,
        "X-Request-ID": auth.requestId,
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return errorResponse("SERVER_ERROR", err.message, 500, auth.requestId);
  }
}

