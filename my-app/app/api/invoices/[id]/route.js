import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import PurchaseOrder from "@/models/PurchaseOrder";
import GRN from "@/models/GRN";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";

export async function GET(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id).lean();
  if (!invoice || invoice.isDeleted) {
    return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  }

  // Only the seller or buyer on this invoice may view it
  const isSeller = String(invoice.sellerId) === String(user._id);
  const isBuyer = String(invoice.buyerId) === String(user._id);
  if (!isSeller && !isBuyer) {
    return errorResponse("FORBIDDEN", "Forbidden", 403, auth.requestId);
  }

  // Populate linked PO and GRN if present
  let po = null;
  let grn = null;
  try {
    if (invoice.poId) po = await PurchaseOrder.findById(invoice.poId).lean();
    if (invoice.grnId) grn = await GRN.findById(invoice.grnId).lean();
  } catch { /* non-critical */ }

  return successResponse({ invoice: { ...invoice, po, grn } }, 200, auth.requestId);
}

export async function PATCH(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) {
    return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  }

  const isSeller = String(invoice.sellerId) === String(user._id);
  const isBuyer = String(invoice.buyerId) === String(user._id);
  if (!isSeller && !isBuyer) {
    return errorResponse("FORBIDDEN", "Forbidden", 403, auth.requestId);
  }

  try {
    const body = await req.json();
    const { status, notes, paymentReceivedAt, reminderEnabled, disputeReason, amountPaid } = body || {};

    const prevStatus = invoice.status;
    const totalAmount = Number(invoice.totalAmount || 0);
    let nextAmountPaid = Math.max(0, Number(invoice.amountPaid || 0));

    if (amountPaid !== undefined) {
      const parsedAmountPaid = Number(amountPaid);
      if (!Number.isFinite(parsedAmountPaid) || parsedAmountPaid < 0 || parsedAmountPaid > totalAmount) {
        return errorResponse("VALIDATION_ERROR", "amountPaid must be between 0 and totalAmount", 400, auth.requestId);
      }
      nextAmountPaid = Math.round(parsedAmountPaid * 100) / 100;
    }

    if (status) {
      if (status === "Settled" || status === "paid") invoice.status = "Paid";
      else invoice.status = status;
    }
    if (typeof notes === "string") invoice.notes = notes;

    if (paymentReceivedAt) {
      const paidAt = new Date(paymentReceivedAt);
      if (Number.isNaN(paidAt.getTime())) {
        return errorResponse("VALIDATION_ERROR", "Invalid paymentReceivedAt", 400, auth.requestId);
      }
      nextAmountPaid = totalAmount;
      invoice.paymentReceivedAt = paidAt;
      invoice.status = "Paid";
      invoice.reminderPolicy.nextReminderAt = null;
    }

    // Enforce payment-status invariants for manual status updates.
    if (invoice.status === "Paid") {
      nextAmountPaid = totalAmount;
      if (!invoice.paymentReceivedAt) {
        invoice.paymentReceivedAt = new Date();
      }
      invoice.reminderPolicy.nextReminderAt = null;
    } else if (invoice.status === "Partially Settled") {
      if (!(nextAmountPaid > 0 && nextAmountPaid < totalAmount)) {
        return errorResponse("VALIDATION_ERROR", "Partially Settled requires amountPaid between 0 and totalAmount", 400, auth.requestId);
      }
      invoice.paymentReceivedAt = null;
    }

    invoice.amountPaid = Math.min(totalAmount, Math.max(0, nextAmountPaid));

    if (typeof reminderEnabled === "boolean") {
      invoice.reminderPolicy.enabled = reminderEnabled;
    }

    if (disputeReason) {
      invoice.disputeReason = String(disputeReason).trim();
      invoice.disputeRaisedAt = new Date();
      invoice.status = "Disputed";
    }

    // Append to audit trail on status change
    if (prevStatus !== invoice.status) {
      invoice.auditTrail.push({
        action: `status_changed_to_${invoice.status.toLowerCase().replace(/\s+/g, "_")}`,
        userId: user._id,
        userName: user.name || user.email,
        timestamp: new Date(),
        details: `Status changed from ${prevStatus} to ${invoice.status}`,
      });
    }

    await invoice.save();
    return successResponse({ invoice }, 200, auth.requestId);
  } catch (err) {
    return errorResponse("SERVER_ERROR", err?.message || "Server error", 500, auth.requestId);
  }
}

export async function DELETE(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  if (user.userType !== "Seller") {
    return errorResponse("FORBIDDEN", "Only sellers can delete invoices", 403, auth.requestId);
  }

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) {
    return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  }

  if (String(invoice.sellerId) !== String(user._id)) {
    return errorResponse("FORBIDDEN", "Forbidden", 403, auth.requestId);
  }

  // Soft delete only — never hard delete financial records
  invoice.isDeleted = true;
  invoice.auditTrail.push({
    action: "invoice_deleted",
    userId: user._id,
    userName: user.name || user.email,
    timestamp: new Date(),
    details: "Invoice soft-deleted by seller",
  });
  await invoice.save();

  return successResponse({ message: "Invoice deleted" }, 200, auth.requestId);
}
