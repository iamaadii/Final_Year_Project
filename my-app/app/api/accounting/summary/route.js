import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";
import { getToken, setToken } from "@/lib/redis";

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  await dbConnect();
  const companyId = user.effectiveCompanyId;
  const userType = user.userType;
  if (!companyId) return errorResponse("FORBIDDEN", "Forbidden: No company context", 403, auth.requestId);

  // Try fetching from Redis Cache first
  const cacheKey = `accounting_summary:${companyId}:${userType}`;
  try {
    const cachedData = await getToken(cacheKey);
    if (cachedData) {
      return successResponse(JSON.parse(cachedData), 200, auth.requestId);
    }
  } catch (err) {
    console.warn("Redis GET failed for summary cache", err);
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const isBuyer = user.userType === "Buyer";

  // Data Isolation: Must match companyIds or be owner
  const baseFilter = { 
    isDeleted: { $ne: true },
    $or: [
      { buyerCompanyId: auth.companyId },
      { sellerCompanyId: auth.companyId },
      { companyId: auth.companyId }
    ]
  };
  const allInvoices = await Invoice.find(baseFilter).lean();

  const unpaidStatuses = ["Pending Approval", "Approved", "Partially Settled", "Under Review", "Overdue", "Disputed"];
  const unpaid = allInvoices.filter((inv) => unpaidStatuses.includes(inv.status));
  const paid = allInvoices.filter((inv) => ["Settled", "Paid", "paid"].includes(inv.status));
  const overdue = unpaid.filter((inv) => new Date(inv.dueDate) < now);

  const totalReceivables = isBuyer ? 0 : unpaid.reduce((s, i) => s + i.totalAmount, 0);
  const totalPayables = isBuyer ? unpaid.reduce((s, i) => s + i.totalAmount, 0) : 0;
  const overdueAmount = overdue.reduce((s, i) => s + i.totalAmount, 0);
  const paidThisMonth = paid
    .filter((i) => i.paymentReceivedAt && new Date(i.paymentReceivedAt) >= thirtyDaysAgo)
    .reduce((s, i) => s + i.totalAmount, 0);

  const totalPaid = paid.reduce((s, i) => s + i.totalAmount, 0);
  const cashInflow = isBuyer ? 0 : totalPaid;
  const cashOutflow = isBuyer ? totalPaid : 0;
  const netWorkingCapital = totalReceivables - totalPayables;

  // DSO / DPO calculation
  const daysWithPayment = paid
    .filter((i) => i.paymentReceivedAt)
    .map((i) => {
      const issue = new Date(i.issueDate);
      const pay = new Date(i.paymentReceivedAt);
      return Math.max(0, Math.floor((pay - issue) / (1000 * 60 * 60 * 24)));
    });
  const avgDays = daysWithPayment.length > 0
    ? Math.round(daysWithPayment.reduce((a, b) => a + b, 0) / daysWithPayment.length)
    : 0;
  const dso = isBuyer ? 0 : avgDays;
  const dpo = isBuyer ? avgDays : 0;

  // Invoice processing efficiency (auto-approved / total matched)
  const matched = allInvoices.filter((i) => i.matchResult?.decision);
  const autoApproved = matched.filter((i) => i.matchResult.decision === "AUTO_APPROVE");
  const matchEfficiency = matched.length > 0
    ? Math.round((autoApproved.length / matched.length) * 100)
    : 0;

  // Discount offers
  const activeOffers = allInvoices.filter((i) => i.discountOffer?.status === "offered");
  const acceptedOffers = allInvoices.filter((i) => i.discountOffer?.status === "accepted");
  const totalYield = acceptedOffers.reduce((s, i) => s + (i.discountOffer?.discountAmount || 0), 0);

  const responseData = {
    totalReceivables: Math.round(totalReceivables * 100) / 100,
    totalPayables: Math.round(totalPayables * 100) / 100,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
    overdueCount: overdue.length,
    paidThisMonth: Math.round(paidThisMonth * 100) / 100,
    outstandingCount: unpaid.length,
    totalInvoices: allInvoices.length,
    cashInflow: Math.round(cashInflow * 100) / 100,
    cashOutflow: Math.round(cashOutflow * 100) / 100,
    netWorkingCapital: Math.round(netWorkingCapital * 100) / 100,
    dso,
    dpo,
    matchEfficiency,
    activeOffers: activeOffers.length,
    acceptedOffers: acceptedOffers.length,
    totalYieldEarned: Math.round(totalYield * 100) / 100,
  };

  try {
    // Cache for 5 minutes
    await setToken(cacheKey, JSON.stringify(responseData), 300);
  } catch (err) {
    console.warn("Redis SET failed for summary cache", err);
  }

  return successResponse(responseData, 200, auth.requestId);
}
