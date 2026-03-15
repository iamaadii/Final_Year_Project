import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { getUserFromToken } from "@/lib/apiAuth";
import { getMsmedDeadline } from "@/lib/complianceCalc";

/**
 * GET /api/dashboard
 * Single endpoint that returns all dashboard data for the logged-in user's role.
 * Eliminates multiple sequential fetches from dashboard pages.
 */
export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const companyId = user.effectiveCompanyId;
  if (!companyId) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const isBuyer = user.userType === "Buyer";
  
  // Data Isolation: Must match companyId
  const allInvoices = await Invoice.find({ companyId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const unpaidStatuses = ["Pending Approval", "Approved", "Under Review", "Overdue", "Disputed"];
  const paidStatuses = ["Settled", "Paid"];
  const unpaid = allInvoices.filter((i) => unpaidStatuses.includes(i.status));
  const paid = allInvoices.filter((i) => paidStatuses.includes(i.status));

  // Overdue
  const overdue = unpaid.filter((i) => new Date(i.dueDate) < now);
  // Upcoming in 7 days
  const upcoming = unpaid.filter((i) => {
    const d = new Date(i.dueDate);
    return d >= now && d <= sevenDaysFromNow;
  });

  const totalAmount = (arr) => arr.reduce((s, i) => s + i.totalAmount, 0);
  const totalReceivables = isBuyer ? 0 : totalAmount(unpaid);
  const totalPayables = isBuyer ? totalAmount(unpaid) : 0;
  const overdueAmount = totalAmount(overdue);
  const paidThisMonth = totalAmount(paid.filter((i) => i.paymentReceivedAt && new Date(i.paymentReceivedAt) >= thirtyDaysAgo));

  // DSO / DPO
  const dsoValues = paid
    .filter((i) => i.paymentReceivedAt && i.issueDate)
    .map((i) => Math.max(0, Math.floor((new Date(i.paymentReceivedAt) - new Date(i.issueDate)) / (1000 * 60 * 60 * 24))));
  const avgDays = dsoValues.length > 0 ? Math.round(dsoValues.reduce((a, b) => a + b, 0) / dsoValues.length) : 0;

  // MSMED compliance summary
  const msmedBreached = unpaid.filter((i) => {
    const deadline = i.msmedDeadline ? new Date(i.msmedDeadline) : getMsmedDeadline(i.issueDate, i.paymentTermsDays || 45);
    return deadline < now;
  });

  // Match efficiency
  const matched = allInvoices.filter((i) => i.matchResult?.decision);
  const autoApproved = matched.filter((i) => i.matchResult.decision === "AUTO_APPROVE");
  const matchEfficiency = matched.length > 0 ? Math.round((autoApproved.length / matched.length) * 100) : 0;

  // Discount offers
  const activeOffers = allInvoices.filter((i) => i.discountOffer?.status === "offered");
  const acceptedOffers = allInvoices.filter((i) => i.discountOffer?.status === "accepted");
  const totalYield = acceptedOffers.reduce((s, i) => s + (i.discountOffer?.discountAmount || 0), 0);

  // Recent invoices (last 10)
  const recentInvoices = allInvoices.slice(0, 10).map((i) => ({
    _id: i._id,
    invoiceNumber: i.invoiceNumber,
    counterparty: isBuyer ? i.sellerName : i.buyerName,
    totalAmount: i.totalAmount,
    status: i.status,
    dueDate: i.dueDate,
    issueDate: i.issueDate,
  }));

  // Overdue list (max 5 for dashboard)
  const overdueList = overdue.slice(0, 5).map((i) => ({
    _id: i._id,
    invoiceNumber: i.invoiceNumber,
    counterparty: isBuyer ? i.sellerName : i.buyerName,
    totalAmount: i.totalAmount,
    dueDate: i.dueDate,
    daysOverdue: Math.floor((now - new Date(i.dueDate)) / (1000 * 60 * 60 * 24)),
  }));

  return NextResponse.json({
    role: user.userType,
    kpis: {
      totalReceivables: Math.round(totalReceivables * 100) / 100,
      totalPayables: Math.round(totalPayables * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      overdueCount: overdue.length,
      paidThisMonth: Math.round(paidThisMonth * 100) / 100,
      upcomingCount: upcoming.length,
      upcomingAmount: Math.round(totalAmount(upcoming) * 100) / 100,
      outstandingCount: unpaid.length,
      totalInvoices: allInvoices.length,
      dso: isBuyer ? 0 : avgDays,
      dpo: isBuyer ? avgDays : 0,
      matchEfficiency,
      activeOffers: activeOffers.length,
      acceptedOffers: acceptedOffers.length,
      totalYieldEarned: Math.round(totalYield * 100) / 100,
      msmedBreachedCount: msmedBreached.length,
      msmedBreachedAmount: Math.round(totalAmount(msmedBreached) * 100) / 100,
    },
    recentInvoices,
    overdueList,
  });
}
