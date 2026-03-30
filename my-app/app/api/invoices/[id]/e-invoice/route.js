import { z } from "zod";
import Invoice from "@/models/Invoice";
import {
  requireAuth,
  parseBody,
  successResponse,
  errorResponse,
  writeAudit,
  createNotification,
  ensureCompanyAccess,
} from "@/lib/api/routeUtils";

function formatInvDate(value) {
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function validGstin(gstin) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9][Z][A-Z0-9]$/i.test(String(gstin || ""));
}

const CancelSchema = z.object({
  cancelReason: z.string().min(1),
  cancelRemarks: z.string().optional(),
});

export async function POST(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const invoice = await Invoice.findById(id);

  if (!invoice || invoice.isDeleted) return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  if (!ensureCompanyAccess(invoice.companyId, auth.companyId)) return errorResponse("FORBIDDEN", "Forbidden", 403, auth.requestId);

  if (!validGstin(invoice.sellerGstin) || !validGstin(invoice.buyerGstin)) {
    return errorResponse("VALIDATION_ERROR", "Seller and buyer GSTIN are required and must be valid", 400, auth.requestId);
  }

  if (Number(invoice.totalAmount || 0) <= 0) {
    return errorResponse("VALIDATION_ERROR", "Invoice amount must be greater than zero", 400, auth.requestId);
  }

  const payload = {
    Version: "1.1",
    TranDtls: { TaxSch: "GST", SupTyp: "B2B", RegRev: "N", EcmGstin: null, IgstOnIntra: "N" },
    DocDtls: { Typ: "INV", No: invoice.invoiceNumber, Dt: formatInvDate(invoice.issueDate) },
    SellerDtls: { Gstin: invoice.sellerGstin, LglNm: invoice.sellerName },
    BuyerDtls: { Gstin: invoice.buyerGstin, LglNm: invoice.buyerName, Pos: "27" },
    ItemList: (invoice.lineItems || []).map((item, i) => ({
      SlNo: String(i + 1),
      PrdDesc: item.description,
      IsServc: "N",
      HsnCd: invoice.hsnCodes?.[i] || "999999",
      Qty: Number(item.quantity || 0),
      Unit: "NOS",
      UnitPrice: Number(item.unitPrice || 0),
      TotAmt: Number(item.total || 0),
      Discount: 0,
      PreTaxVal: Number(item.total || 0),
      AssAmt: Number(item.total || 0),
      GstRt: 18,
      IgstAmt: 0,
      CgstAmt: Number(item.total || 0) * 0.09,
      SgstAmt: Number(item.total || 0) * 0.09,
      CesRt: 0,
      CesAmt: 0,
      CesNonAdvlAmt: 0,
      StateCesRt: 0,
      StateCesAmt: 0,
      StateCesNonAdvlAmt: 0,
      OthChrg: 0,
      TotItemVal: Number(item.total || 0),
    })),
    ValDtls: {
      AssVal: Number(invoice.subtotalAmount || 0),
      CgstVal: Number(invoice.taxAmount || 0) / 2,
      SgstVal: Number(invoice.taxAmount || 0) / 2,
      IgstVal: 0,
      TotInvVal: Number(invoice.totalAmount || 0),
    },
  };

  const endpoint = `${process.env.GSP_API_URL || "https://einv-apisandbox.nic.in"}/eivital/dec/v1.04/einvoice`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.GSP_API_KEY || "",
        "x-gstin": process.env.GSP_GSTIN || "",
        "x-username": process.env.GSP_USERNAME || "",
        "x-password": process.env.GSP_PASSWORD || "",
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      invoice.eInvoiceStatus = "pending";
      await invoice.save();
      return errorResponse("GSP_SUBMIT_FAILED", "Failed to submit e-invoice", 502, auth.requestId, body);
    }

    invoice.eInvoiceIRN = body.Irn || body.irn || null;
    invoice.eInvoiceAckNo = body.AckNo || body.ackNo || null;
    invoice.eInvoiceAckDate = body.AckDt ? new Date(body.AckDt) : null;
    invoice.eInvoiceQRCode = body.SignedQRCode || body.signedQRCode || null;
    invoice.eInvoiceStatus = "submitted";
    await invoice.save();

    await createNotification({
      userId: String(invoice.sellerId),
      companyId: auth.companyId,
      type: "einvoice_submitted",
      priority: "medium",
      title: "E-invoice submitted",
      body: `Invoice ${invoice.invoiceNumber} was submitted to IRP successfully.`,
      entityType: "invoice",
      entityId: invoice._id.toString(),
      actionUrl: `/seller/invoices?id=${invoice._id}`,
    });

    await writeAudit({
      user: auth.user,
      companyId: auth.companyId,
      action: "invoice_einvoice_submitted",
      resource: "Invoice",
      resourceId: invoice._id,
      details: { irn: invoice.eInvoiceIRN, ackNo: invoice.eInvoiceAckNo },
      req,
    });

    return successResponse(invoice, 200, auth.requestId);
  } catch (error) {
    invoice.eInvoiceStatus = "pending";
    await invoice.save();
    return errorResponse("GSP_ERROR", "Failed to connect to GSP endpoint", 502, auth.requestId, { message: error?.message || "Unknown error" });
  }
}

export async function DELETE(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(req, CancelSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  const invoice = await Invoice.findById(id);

  if (!invoice || invoice.isDeleted) return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  if (!ensureCompanyAccess(invoice.companyId, auth.companyId)) return errorResponse("FORBIDDEN", "Forbidden", 403, auth.requestId);
  if (!invoice.eInvoiceIRN) return errorResponse("INVALID_STATE", "IRN not available for cancellation", 400, auth.requestId);

  const submittedAt = invoice.eInvoiceAckDate ? new Date(invoice.eInvoiceAckDate).getTime() : 0;
  if (submittedAt && Date.now() - submittedAt > 24 * 60 * 60 * 1000) {
    return errorResponse("CANCEL_WINDOW_EXPIRED", "IRN can only be cancelled within 24 hours", 400, auth.requestId);
  }

  const endpoint = `${process.env.GSP_API_URL || "https://einv-apisandbox.nic.in"}/eivital/dec/v1.04/einvoice/cancel`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.GSP_API_KEY || "",
        "x-gstin": process.env.GSP_GSTIN || "",
        "x-username": process.env.GSP_USERNAME || "",
        "x-password": process.env.GSP_PASSWORD || "",
      },
      body: JSON.stringify({
        Irn: invoice.eInvoiceIRN,
        CnlRsn: parsed.data.cancelReason,
        CnlRem: parsed.data.cancelRemarks || "Cancelled by user",
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return errorResponse("GSP_CANCEL_FAILED", "Failed to cancel e-invoice", 502, auth.requestId, body);
    }

    invoice.eInvoiceStatus = "cancelled";
    invoice.eInvoiceIRN = null;
    invoice.eInvoiceAckNo = null;
    invoice.eInvoiceAckDate = null;
    invoice.eInvoiceQRCode = null;
    await invoice.save();

    await writeAudit({
      user: auth.user,
      companyId: auth.companyId,
      action: "invoice_einvoice_cancelled",
      resource: "Invoice",
      resourceId: invoice._id,
      details: parsed.data,
      req,
    });

    return successResponse(invoice, 200, auth.requestId);
  } catch (error) {
    return errorResponse("GSP_ERROR", "Failed to connect to GSP endpoint", 502, auth.requestId, { message: error?.message || "Unknown error" });
  }
}
