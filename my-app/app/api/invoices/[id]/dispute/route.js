import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { getUserFromToken } from "@/lib/apiAuth";

export async function POST(req, { params }) {
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

  if (invoice.status === "Settled" || invoice.status === "Paid") {
    return NextResponse.json({ message: "Cannot dispute a settled invoice" }, { status: 400 });
  }

  try {
    const { reason } = await req.json();
    if (!reason || !String(reason).trim()) {
      return NextResponse.json({ message: "Dispute reason is required" }, { status: 400 });
    }

    invoice.status = "Disputed";
    invoice.disputeReason = String(reason).trim();
    invoice.disputeRaisedAt = new Date();
    invoice.auditTrail.push({
      action: "dispute_raised",
      userId: user._id,
      userName: user.name || user.email,
      timestamp: new Date(),
      details: `Dispute raised by ${user.userType}: ${String(reason).trim()}`,
    });

    await invoice.save();
    return NextResponse.json({ message: "Dispute raised", invoice }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  // Only buyers can resolve disputes (they approve payment)
  if (user.userType !== "Buyer") {
    return NextResponse.json({ message: "Only buyers can resolve disputes" }, { status: 403 });
  }

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  }

  if (String(invoice.buyerId) !== String(user._id)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { resolution, newStatus = "Approved" } = await req.json();
    const validStatuses = ["Approved", "Settled"];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ message: `newStatus must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    invoice.status = newStatus;
    invoice.auditTrail.push({
      action: "dispute_resolved",
      userId: user._id,
      userName: user.name || user.email,
      timestamp: new Date(),
      details: `Dispute resolved. ${resolution ? "Notes: " + String(resolution).trim() : ""}`,
    });

    await invoice.save();
    return NextResponse.json({ message: "Dispute resolved", invoice }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
