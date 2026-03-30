import Invoice from "@/models/Invoice";
import TreasuryConfig from "@/models/TreasuryConfig";
import {
  requireAuth,
  successResponse,
  errorResponse,
  writeAudit,
  ensureCompanyAccess,
} from "@/lib/api/routeUtils";

function razorpayAuthHeader() {
  const key = process.env.RAZORPAY_KEY_ID || "";
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

export async function POST(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const treasuryConfig = await TreasuryConfig.findOne({ companyId: auth.companyId }).lean();
  if (treasuryConfig?.paused) {
    return errorResponse("TREASURY_PAUSED", "Treasury programs are paused", 409, auth.requestId);
  }

  const { id } = await params;
  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  if (!ensureCompanyAccess(invoice.companyId, auth.companyId)) return errorResponse("FORBIDDEN", "Forbidden", 403, auth.requestId);

  const payload = {
    amount: Math.round(Number(invoice.totalAmount || 0) * 100),
    currency: "INR",
    description: `Payment for Invoice ${invoice.invoiceNumber}`,
    reference_id: invoice._id.toString(),
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/razorpay/webhook`,
    callback_method: "get",
    customer: { name: invoice.buyerName, email: invoice.buyerEmail },
    notify: { sms: false, email: true },
    reminder_enable: true,
    notes: { invoice_id: invoice._id.toString(), invoice_number: invoice.invoiceNumber },
  };

  const response = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: razorpayAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return errorResponse("RAZORPAY_ERROR", "Failed to create payment link", 502, auth.requestId, body);
  }

  invoice.paymentLinkId = body.id || null;
  invoice.paymentLinkUrl = body.short_url || body.long_url || null;
  await invoice.save();

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "invoice_payment_link_created",
    resource: "Invoice",
    resourceId: invoice._id,
    details: { paymentLinkId: invoice.paymentLinkId },
    req,
  });

  return successResponse({ paymentLinkUrl: invoice.paymentLinkUrl }, 200, auth.requestId);
}
