import crypto from "crypto";
import Invoice from "@/models/Invoice";
import {
  successResponse,
  errorResponse,
} from "@/lib/api/routeUtils";

function verifySignature(body, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const digest = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return digest === signature;
}

export async function POST(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const signature = req.headers.get("x-razorpay-signature") || "";
  const raw = await req.text();

  if (!verifySignature(raw, signature)) {
    return errorResponse("INVALID_SIGNATURE", "Invalid webhook signature", 400, requestId);
  }

  const payload = JSON.parse(raw || "{}");
  if (payload.event !== "payment.captured") {
    return successResponse({ received: true, ignored: true }, 200, requestId);
  }

  const invoiceId = payload?.payload?.payment?.entity?.notes?.invoice_id || payload?.payload?.payment_link?.entity?.reference_id;
  if (!invoiceId) {
    return errorResponse("INVALID_PAYLOAD", "Invoice reference not found in webhook payload", 400, requestId);
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice || invoice.isDeleted) {
    return errorResponse("NOT_FOUND", "Invoice not found", 404, requestId);
  }

  const totalAmount = Number(invoice.totalAmount || 0);
  const currentPaid = Math.min(totalAmount, Math.max(0, Number(invoice.amountPaid || 0)));
  const capturedPaise = Number(payload?.payload?.payment?.entity?.amount || 0);
  const capturedAmount = Number.isFinite(capturedPaise) && capturedPaise > 0
    ? capturedPaise / 100
    : Math.max(0, totalAmount - currentPaid);
  const nextPaid = Math.min(totalAmount, Math.round((currentPaid + capturedAmount) * 100) / 100);
  const fullySettled = nextPaid >= totalAmount - 0.01;

  invoice.amountPaid = nextPaid;
  invoice.status = fullySettled ? "Paid" : "Partially Settled";
  invoice.paymentReceivedAt = fullySettled ? new Date() : null;
  invoice.paymentMode = "manual";
  invoice.paymentUTR = payload?.payload?.payment?.entity?.id || null;
  await invoice.save();

  return successResponse({ received: true, reconciled: true }, 200, requestId);
}
