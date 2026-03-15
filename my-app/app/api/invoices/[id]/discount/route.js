import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Invoice from "@/models/Invoice";

async function getUserFromToken(req) {
  const token = req.cookies.get("token")?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;
  try {
    const payload = jwt.verify(token, secret);
    if (!payload?.id) return null;
    await dbConnect();
    return await User.findById(payload.id);
  } catch {
    return null;
  }
}

// POST: Buyer creates a discount offer on an approved invoice
export async function POST(req, { params }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.userType !== "Buyer") {
    return NextResponse.json({ message: "Only buyers can offer early payments" }, { status: 403 });
  }

  const { id } = await params;
  const { discountRate } = await req.json();

  if (!discountRate || discountRate <= 0 || discountRate > 10) {
    return NextResponse.json({ message: "discountRate must be between 0.01 and 10 (%)" }, { status: 400 });
  }

  await dbConnect();
  const invoice = await Invoice.findById(id);
  if (!invoice) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  if (invoice.status !== "Approved") {
    return NextResponse.json({ message: "Can only offer discounts on approved invoices" }, { status: 400 });
  }

  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  const daysAccelerated = Math.max(0, Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)));
  const discountAmount = Math.round(invoice.totalAmount * (discountRate / 100) * 100) / 100;
  const earlyPaymentAmount = Math.round((invoice.totalAmount - discountAmount) * 100) / 100;

  invoice.discountOffer = {
    offeredAt: now,
    discountAmount,
    discountRate,
    daysAccelerated,
    status: "offered",
    earlyPaymentAmount,
  };

  invoice.auditTrail.push({
    action: "discount_offered",
    userId: user._id,
    userName: user.name,
    details: `Offered ${discountRate}% discount (INR ${discountAmount}) for ${daysAccelerated} days early payment`,
  });

  await invoice.save();

  return NextResponse.json({
    message: "Discount offer sent",
    discountOffer: invoice.discountOffer,
    annualizedYield: daysAccelerated > 0
      ? Math.round((discountRate / 100) * (365 / daysAccelerated) * 10000) / 100 + "%"
      : "N/A",
  });
}

// PATCH: Seller accepts/declines the discount offer
export async function PATCH(req, { params }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.userType !== "Seller") {
    return NextResponse.json({ message: "Only sellers can respond to discount offers" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await req.json(); // "accept" | "decline"

  await dbConnect();
  const invoice = await Invoice.findById(id);
  if (!invoice) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  if (invoice.discountOffer?.status !== "offered") {
    return NextResponse.json({ message: "No active discount offer to respond to" }, { status: 400 });
  }

  if (action === "accept") {
    invoice.discountOffer.status = "accepted";
    invoice.discountOffer.acceptedAt = new Date();
    invoice.auditTrail.push({
      action: "discount_accepted",
      userId: user._id,
      userName: user.name,
      details: `Accepted discount of INR ${invoice.discountOffer.discountAmount} for early payment of INR ${invoice.discountOffer.earlyPaymentAmount}`,
    });
  } else {
    invoice.discountOffer.status = "declined";
    invoice.auditTrail.push({
      action: "discount_declined",
      userId: user._id,
      userName: user.name,
      details: "Declined the early payment discount offer",
    });
  }

  await invoice.save();
  return NextResponse.json({ message: `Discount offer ${action}ed`, discountOffer: invoice.discountOffer });
}
