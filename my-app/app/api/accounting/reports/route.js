import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";

function groupByMonth(invoices, dateField) {
  const groups = {};
  invoices.forEach((inv) => {
    const d = new Date(inv[dateField]);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = { month: key, total: 0, count: 0 };
    groups[key].total += inv.totalAmount;
    groups[key].count += 1;
  });
  return Object.values(groups).sort((a, b) => a.month.localeCompare(b.month));
}

function agingBuckets(invoices, now) {
  const buckets = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 };
  const bucketDetails = { current: [], d1_30: [], d31_60: [], d61_90: [], d90plus: [] };
  invoices.forEach((inv) => {
    const due = new Date(inv.dueDate);
    const days = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    let bucket;
    if (days <= 0) bucket = "current";
    else if (days <= 30) bucket = "d1_30";
    else if (days <= 60) bucket = "d31_60";
    else if (days <= 90) bucket = "d61_90";
    else bucket = "d90plus";
    buckets[bucket] += inv.totalAmount;
    bucketDetails[bucket].push({
      invoiceNumber: inv.invoiceNumber,
      counterparty: inv.sellerName || inv.buyerName,
      amount: inv.totalAmount,
      daysOverdue: Math.max(0, days),
    });
  });
  return { totals: buckets, details: bucketDetails };
}

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  await dbConnect();
  const companyId = user.effectiveCompanyId;
  if (!companyId) return errorResponse("FORBIDDEN", "Forbidden", 403, auth.requestId);

  const url = new URL(req.url);
  const reportType = url.searchParams.get("type") || "pnl";
  const days = parseInt(url.searchParams.get("days") || "90", 10);

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Data Isolation: Must match companyIds or be owner
  const allInvoices = await Invoice.find({ 
    isDeleted: { $ne: true },
    $or: [
      { buyerCompanyId: auth.companyId },
      { sellerCompanyId: auth.companyId },
      { companyId: auth.companyId }
    ]
  }).lean();
  const periodInvoices = allInvoices.filter((i) => new Date(i.issueDate) >= since);

  const unpaidStatuses = ["Pending Approval", "Approved", "Partially Settled", "Under Review", "Overdue", "Disputed"];
  const paidStatuses = ["Settled", "Paid", "paid"];

  // The `isBuyer` logic is still needed for report-specific calculations (AR/AP, Inflow/Outflow)
  const isBuyer = user.userType === "Buyer";

  if (reportType === "pnl") {
    // Revenue = sum of all invoices issued (seller) or expenses (buyer)
    const revenue = periodInvoices.reduce((s, i) => s + i.totalAmount, 0);
    const tax = periodInvoices.reduce((s, i) => s + (i.taxAmount || 0), 0);
    const subtotal = revenue - tax;
    const discountsGiven = periodInvoices
      .filter((i) => i.discountOffer?.status === "accepted")
      .reduce((s, i) => s + (i.discountOffer.discountAmount || 0), 0);

    return successResponse(
      {
        report: "Profit & Loss",
        period: `Last ${days} days`,
        data: {
          grossRevenue: Math.round(subtotal * 100) / 100,
          taxCollected: Math.round(tax * 100) / 100,
          totalRevenue: Math.round(revenue * 100) / 100,
          discounts: Math.round(discountsGiven * 100) / 100,
          netRevenue: Math.round((revenue - discountsGiven) * 100) / 100,
          invoiceCount: periodInvoices.length,
        },
        monthlyBreakdown: groupByMonth(periodInvoices, "issueDate"),
      },
      200,
      auth.requestId,
    );
  }

  if (reportType === "balance-sheet") {
    const unpaid = allInvoices.filter((i) => unpaidStatuses.includes(i.status));
    const paid = allInvoices.filter((i) => paidStatuses.includes(i.status));

    const ar = isBuyer ? 0 : unpaid.reduce((s, i) => s + i.totalAmount, 0);
    const ap = isBuyer ? unpaid.reduce((s, i) => s + i.totalAmount, 0) : 0;
    const cashRealized = paid.reduce((s, i) => s + i.totalAmount, 0);

    return successResponse(
      {
        report: "Balance Sheet",
        asOf: now.toISOString(),
        data: {
          assets: {
            accountsReceivable: Math.round(ar * 100) / 100,
            cashRealized: Math.round(cashRealized * 100) / 100,
            totalAssets: Math.round((ar + cashRealized) * 100) / 100,
          },
          liabilities: {
            accountsPayable: Math.round(ap * 100) / 100,
            totalLiabilities: Math.round(ap * 100) / 100,
          },
          equity: Math.round((ar + cashRealized - ap) * 100) / 100,
        },
      },
      200,
      auth.requestId,
    );
  }

  if (reportType === "cashflow") {
    const paid = allInvoices.filter((i) => paidStatuses.includes(i.status) && i.paymentReceivedAt);
    const monthlyInflow = groupByMonth(
      paid.filter(() => !isBuyer),
      "paymentReceivedAt",
    );
    const monthlyOutflow = groupByMonth(
      paid.filter(() => isBuyer),
      "paymentReceivedAt",
    );

    return successResponse(
      {
        report: "Cash Flow Statement",
        period: `Last ${days} days`,
        data: { monthlyInflow, monthlyOutflow },
      },
      200,
      auth.requestId,
    );
  }

  if (reportType === "aging") {
    const unpaid = allInvoices.filter((i) => unpaidStatuses.includes(i.status));
    const aging = agingBuckets(unpaid, now);

    return successResponse(
      {
        report: isBuyer ? "AP Aging" : "AR Aging",
        asOf: now.toISOString(),
        data: aging,
      },
      200,
      auth.requestId,
    );
  }

  return errorResponse("VALIDATION_ERROR", "Unknown report type. Use: pnl, balance-sheet, cashflow, aging", 400, auth.requestId);
}
