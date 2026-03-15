import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Invoice from "@/models/Invoice";
import { calculatePenalty, getOverdueDays, getMsmedDeadline } from "@/lib/complianceCalc";

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

export async function GET(req, { params }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id).lean();
  if (!invoice) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });

  // Calculate MSMED deadline
  const deadline = invoice.msmedDeadline
    ? new Date(invoice.msmedDeadline)
    : getMsmedDeadline(invoice.issueDate, invoice.paymentTermsDays || 45);

  const overdueDays = getOverdueDays(deadline, invoice.paymentReceivedAt);

  const rbiRate = parseFloat(process.env.RBI_BANK_RATE || "0.065");
  const penalty = calculatePenalty(invoice.totalAmount, overdueDays, rbiRate);

  return NextResponse.json({
    invoiceNumber: invoice.invoiceNumber,
    sellerName: invoice.sellerName,
    buyerName: invoice.buyerName,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    msmedDeadline: deadline,
    paymentTermsDays: invoice.paymentTermsDays,
    status: invoice.status,
    ...penalty,
  });
}
