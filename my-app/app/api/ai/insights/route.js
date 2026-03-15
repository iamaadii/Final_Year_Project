import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { getUserFromToken } from "@/lib/apiAuth";
import { generateWorkingCapitalInsights } from "@/lib/aiInsights";

/**
 * GET /api/ai/insights
 * Returns Gemini-powered (or rule-based fallback) working capital advisory.
 * Model: Gemini 1.5 Flash | Self-supervised + RLHF | Batch | Model-based
 */
export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const isBuyer = user.userType === "Buyer";
  const roleFilter = isBuyer ? { buyerId: user._id } : { sellerId: user._id };
  const allInvoices = await Invoice.find({ ...roleFilter, isDeleted: false }).lean();

  const unpaidStatuses = ["Pending Approval", "Approved", "Under Review", "Overdue", "Disputed"];
  const paidStatuses = ["Settled", "Paid"];
  const unpaid = allInvoices.filter((i) => unpaidStatuses.includes(i.status));
  const paid = allInvoices.filter((i) => paidStatuses.includes(i.status));
  const overdue = unpaid.filter((i) => new Date(i.dueDate) < now);

  const totalAmount = (arr) => arr.reduce((s, i) => s + i.totalAmount, 0);
  const dsoValues = paid
    .filter((i) => i.paymentReceivedAt)
    .map((i) => Math.max(0, Math.floor((new Date(i.paymentReceivedAt) - new Date(i.issueDate)) / (1000 * 60 * 60 * 24))));
  const avgDays = dsoValues.length > 0 ? Math.round(dsoValues.reduce((a, b) => a + b, 0) / dsoValues.length) : 0;

  const matched = allInvoices.filter((i) => i.matchResult?.decision);
  const autoApproved = matched.filter((i) => i.matchResult.decision === "AUTO_APPROVE");
  const acceptedOffers = allInvoices.filter((i) => i.discountOffer?.status === "accepted");

  const kpis = {
    totalReceivables: isBuyer ? 0 : totalAmount(unpaid),
    totalPayables: isBuyer ? totalAmount(unpaid) : 0,
    overdueAmount: totalAmount(overdue),
    overdueCount: overdue.length,
    paidThisMonth: totalAmount(paid.filter((i) => i.paymentReceivedAt && new Date(i.paymentReceivedAt) >= thirtyDaysAgo)),
    outstandingCount: unpaid.length,
    dso: isBuyer ? 0 : avgDays,
    dpo: isBuyer ? avgDays : 0,
    matchEfficiency: matched.length > 0 ? Math.round((autoApproved.length / matched.length) * 100) : 0,
    totalYieldEarned: acceptedOffers.reduce((s, i) => s + (i.discountOffer?.discountAmount || 0), 0),
  };

  const insights = await generateWorkingCapitalInsights(kpis, user.userType);
  const aiPowered = !!process.env.GOOGLE_GEMINI_API_KEY;

  return NextResponse.json({ ...insights, aiPowered, role: user.userType });
}
