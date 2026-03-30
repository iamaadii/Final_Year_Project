import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { get43BhBucket } from "@/lib/complianceCalc";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";
import { getToken, setToken } from "@/lib/redis";

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.user.userType !== "Buyer") {
    return errorResponse("FORBIDDEN", "Only buyers can view 43B(h) radar", 403, auth.requestId);
  }

  await dbConnect();
  const companyId = auth.companyId;
  if (!companyId) return errorResponse("FORBIDDEN", "Forbidden", 403, auth.requestId);

  // Try fetching from Redis Cache first
  const cacheKey = `43bh_radar:${companyId}`;
  try {
    const cachedData = await getToken(cacheKey);
    if (cachedData) {
      return successResponse(JSON.parse(cachedData), 200, auth.requestId);
    }
  } catch (err) {
    console.warn("Redis GET failed for 43bh radar cache", err);
  }

  // Get all unpaid invoices for this buyer with isolation
  const invoices = await Invoice.find({
    companyId,
    isDeleted: false,
    status: { $nin: ["Settled", "Paid", "paid", "Draft", "draft", "Cancelled", "cancelled"] },
    paymentReceivedAt: null,
  }).lean();

  const now = new Date();
  const buckets = { safe: [], approaching: [], at_risk: [], breached: [] };
  let totalTaxExposure = 0;

  for (const inv of invoices) {
    // Use approval date or issue date to calculate days
    const referenceDate = inv.updatedAt || inv.issueDate;
    const daysSince = Math.floor((now - new Date(referenceDate)) / (1000 * 60 * 60 * 24));
    const bucket = get43BhBucket(daysSince);

    const amountPaid = Number(inv.amountPaid || 0);
    const totalAmount = Number(inv.totalAmount || 0);
    const remainingAmount = Math.max(totalAmount - amountPaid, 0);

    const item = {
      _id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      sellerName: inv.sellerName,
      totalAmount,
      amountPaid,
      remainingAmount,
      issueDate: inv.issueDate,
      daysSince,
      dueDate: inv.dueDate,
      status: inv.status,
    };

    buckets[bucket].push(item);

    if (bucket === "breached") {
      totalTaxExposure += remainingAmount;
    }
  }

  const responseData = {
    buckets,
    summary: {
      safe: buckets.safe.length,
      approaching: buckets.approaching.length,
      at_risk: buckets.at_risk.length,
      breached: buckets.breached.length,
      total: invoices.length,
      totalTaxExposure: Math.round(totalTaxExposure * 100) / 100,
    },
  };

  try {
    // Cache for 5 minutes
    await setToken(cacheKey, JSON.stringify(responseData), 300);
  } catch (err) {
    console.warn("Redis SET failed for 43bh radar cache", err);
  }

  return successResponse(responseData, 200, auth.requestId);
}
