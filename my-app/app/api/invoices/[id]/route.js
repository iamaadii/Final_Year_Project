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

export async function PATCH(req, { params }) {
  const user = await getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const invoice = await Invoice.findById(params.id);
  if (!invoice || invoice.isDeleted) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  }

  const isSellerOwner = String(invoice.sellerId) === String(user._id);
  const isBuyerOwner = String(invoice.buyerId) === String(user._id);
  if (!isSellerOwner && !isBuyerOwner) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      status,
      notes,
      paymentReceivedAt,
      reminderEnabled,
    } = body || {};

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

    await invoice.save();
    return NextResponse.json({ message: "Invoice updated", invoice }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
