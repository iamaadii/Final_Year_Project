import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Invoice from "@/models/Invoice";
import { getUserFromToken } from "@/lib/apiAuth";

/** GET /api/vendors/[id]/score — detailed vendor reliability score */
export async function GET(req, { params }) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const vendor = await User.findById(id).select("_id name email userType gstNumber udhyamNumber").lean();
  if (!vendor) return NextResponse.json({ message: "Vendor not found" }, { status: 404 });

  // Build query based on who's asking
  let invoiceFilter;
  if (user.userType === "Buyer" && vendor.userType === "Seller") {
    invoiceFilter = { buyerId: user._id, sellerId: id, isDeleted: false };
  } else if (user.userType === "Seller" && vendor.userType === "Buyer") {
    invoiceFilter = { sellerId: user._id, buyerId: id, isDeleted: false };
  } else {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const invoices = await Invoice.find(invoiceFilter).lean();
  const now = new Date();

  const settled = invoices.filter((i) => ["Settled", "Paid"].includes(i.status));
  const disputed = invoices.filter((i) => i.status === "Disputed");
  const overdue = invoices.filter((i) => new Date(i.dueDate) < now && !["Settled", "Paid"].includes(i.status));
  const matched = invoices.filter((i) => i.matchResult?.decision);
  const autoApproved = matched.filter((i) => i.matchResult.decision === "AUTO_APPROVE");

  const dsoValues = settled
    .filter((i) => i.paymentReceivedAt && i.issueDate)
    .map((i) => Math.max(0, Math.floor((new Date(i.paymentReceivedAt) - new Date(i.issueDate)) / (1000 * 60 * 60 * 24))));
  const avgDso = dsoValues.length > 0 ? dsoValues.reduce((a, b) => a + b, 0) / dsoValues.length : null;

  const paymentRate = invoices.length > 0 ? (settled.length / invoices.length) * 100 : null;
  const disputeRateRaw = invoices.length > 0 ? (disputed.length / invoices.length) * 100 : null;
  const matchRate = matched.length > 0 ? (autoApproved.length / matched.length) * 100 : null;

  const dsoScore = avgDso !== null ? Math.max(0, 100 - Math.max(0, (avgDso - 30) * 1.5)) : 70;
  const score = paymentRate !== null
    ? Math.min(100, Math.max(0, Math.round(
        (paymentRate ?? 50) * 0.35 +
        ((100 - (disputeRateRaw ?? 0)) * 0.25) +
        ((matchRate ?? 70) * 0.20) +
        (dsoScore * 0.20)
      )))
    : 50;

  // Trend: compare last 90 days vs previous
  const recent90 = invoices.filter((i) => new Date(i.issueDate) >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000));
  const recentSettled = recent90.filter((i) => ["Settled", "Paid"].includes(i.status));
  const recentPayRate = recent90.length > 0 ? (recentSettled.length / recent90.length) * 100 : null;
  const trend = recentPayRate !== null && paymentRate !== null
    ? recentPayRate > paymentRate ? "improving" : recentPayRate < paymentRate ? "declining" : "stable"
    : "insufficient_data";

  const totalBusiness = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const lastInvoice = invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  return NextResponse.json({
    vendor,
    score,
    trend,
    grade: score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D",
    breakdown: {
      paymentRate: paymentRate !== null ? Math.round(paymentRate) : null,
      disputeRate: disputeRateRaw !== null ? Math.round(disputeRateRaw) : null,
      matchRate: matchRate !== null ? Math.round(matchRate) : null,
      avgDso: avgDso !== null ? Math.round(avgDso) : null,
    },
    stats: {
      totalInvoices: invoices.length,
      settled: settled.length,
      overdue: overdue.length,
      disputed: disputed.length,
      totalBusiness: Math.round(totalBusiness * 100) / 100,
      lastInvoiceDate: lastInvoice?.issueDate || null,
    },
  });
}
