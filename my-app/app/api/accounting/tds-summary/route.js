import Invoice from "@/models/Invoice";
import { requireAuth, successResponse } from "@/lib/api/routeUtils";

function financialYearRange(financialYear) {
  if (!financialYear) return null;
  const [start, end] = String(financialYear).split("-");
  if (!start || !end) return null;
  const startYear = Number(start);
  const endYear = Number(`20${end}`);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return null;
  return { start: new Date(startYear, 3, 1), end: new Date(endYear, 2, 31, 23, 59, 59, 999) };
}

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const companyId = req.nextUrl.searchParams.get("companyId") || auth.companyId;
  const financialYear = req.nextUrl.searchParams.get("financialYear");
  const vendorId = req.nextUrl.searchParams.get("vendorId");

  const dateRange = financialYearRange(financialYear);
  const filter = {
    companyId,
    tdsAmount: { $gt: 0 },
    isDeleted: false,
  };

  if (vendorId) filter.sellerId = vendorId;
  if (dateRange) filter.issueDate = { $gte: dateRange.start, $lte: dateRange.end };

  const invoices = await Invoice.find(filter).lean();
  const grouped = new Map();

  for (const inv of invoices) {
    const key = String(inv.sellerId || inv.sellerEmail || inv.sellerName || inv._id);
    const cur = grouped.get(key) || {
      vendorId: String(inv.sellerId || ""),
      vendorName: inv.sellerName || "",
      gstin: inv.sellerGstin || "",
      pan: "",
      totalInvoiceAmount: 0,
      totalTDSDeducted: 0,
      sectionBreakdown: {},
    };

    cur.totalInvoiceAmount += Number(inv.totalAmount || 0);
    cur.totalTDSDeducted += Number(inv.tdsAmount || 0);
    const section = inv.tdsSection || "unspecified";
    cur.sectionBreakdown[section] = (cur.sectionBreakdown[section] || 0) + Number(inv.tdsAmount || 0);
    grouped.set(key, cur);
  }

  return successResponse({ items: [...grouped.values()] }, 200, auth.requestId);
}
