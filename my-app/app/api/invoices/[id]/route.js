import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import PurchaseOrder from "@/models/PurchaseOrder";
import GRN from "@/models/GRN";
import { getUserFromToken } from "@/lib/apiAuth";

export async function GET(req, { params }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id).lean();
  if (!invoice || invoice.isDeleted) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  }

  // Only the seller or buyer on this invoice may view it
  const isSeller = String(invoice.sellerId) === String(user._id);
  const isBuyer = String(invoice.buyerId) === String(user._id);
  if (!isSeller && !isBuyer) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // Populate linked PO and GRN if present
  let po = null;
  let grn = null;
  try {
    if (invoice.poId) po = await PurchaseOrder.findById(invoice.poId).lean();
    if (invoice.grnId) grn = await GRN.findById(invoice.grnId).lean();
  } catch { /* non-critical */ }

  return NextResponse.json({ invoice: { ...invoice, po, grn } }, { status: 200 });
}

export async function PATCH(req, { params }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  }

  const isSeller = String(invoice.sellerId) === String(user._id);
  const isBuyer = String(invoice.buyerId) === String(user._id);
  if (!isSeller && !isBuyer) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status, notes, paymentReceivedAt, reminderEnabled, disputeReason } = body || {};

    const prevStatus = invoice.status;

    if (status) invoice.status = status;
    if (typeof notes === "string") invoice.notes = notes;

    if (paymentReceivedAt) {
      const paidAt = new Date(paymentReceivedAt);
      if (Number.isNaN(paidAt.getTime())) {
        return NextResponse.json({ message: "Invalid paymentReceivedAt" }, { status: 400 });
      }
      invoice.paymentReceivedAt = paidAt;
      invoice.status = "Settled";
      invoice.reminderPolicy.nextReminderAt = null;
    }

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
    return NextResponse.json({ message: "Invoice updated", invoice }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: "Server error", error: err?.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.userType !== "Seller") {
    return NextResponse.json({ message: "Only sellers can delete invoices" }, { status: 403 });
  }

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  }

  if (String(invoice.sellerId) !== String(user._id)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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

  return NextResponse.json({ message: "Invoice deleted" }, { status: 200 });
}
