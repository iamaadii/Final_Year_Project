import dbConnect from "@/lib/db";
import User from "@/models/User";
import Invoice from "@/models/Invoice";
import CounterpartyLink from "@/models/CounterpartyLink";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";

/**
 * Compute a vendor reliability score (0-100) from invoice history.
 * Supervision: Unsupervised (weighted aggregation, no labels)
 * Learning: Batch | Approach: Model-based (statistical)
 */
function computeReliabilityScore(invoices, now) {
  if (!invoices.length) return { score: 50, breakdown: null };

  const total = invoices.length;
  const settled = invoices.filter((i) => ["Settled", "Paid", "paid"].includes(i.status));
  const disputed = invoices.filter((i) => i.status === "Disputed");
  const matched = invoices.filter((i) => i.matchResult?.decision);
  const autoApproved = matched.filter((i) => i.matchResult.decision === "AUTO_APPROVE");
  const overdue = invoices.filter((i) => new Date(i.dueDate) < now && !["Settled", "Paid", "paid"].includes(i.status));

  // DSO calculation from settled invoices
  const dsoValues = settled
    .filter((i) => i.paymentReceivedAt && i.issueDate)
    .map((i) => Math.max(0, Math.floor((new Date(i.paymentReceivedAt) - new Date(i.issueDate)) / (1000 * 60 * 60 * 24))));
  const avgDso = dsoValues.length > 0 ? dsoValues.reduce((a, b) => a + b, 0) / dsoValues.length : 45;

  // Weighted score components (all 0-100)
  const paymentRate = total > 0 ? (settled.length / total) * 100 : 50;        // 35% weight
  const disputeRate = total > 0 ? ((total - disputed.length) / total) * 100 : 100; // 25% weight
  const matchRate = matched.length > 0 ? (autoApproved.length / matched.length) * 100 : 70; // 20% weight
  const dsoScore = Math.max(0, 100 - Math.max(0, (avgDso - 30) * 1.5));       // 20% weight

  const score = Math.round(
    paymentRate * 0.35 +
    disputeRate * 0.25 +
    matchRate * 0.20 +
    dsoScore * 0.20
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      paymentRate: Math.round(paymentRate),
      disputeRate: Math.round(disputeRate),
      matchRate: Math.round(matchRate),
      dsoScore: Math.round(dsoScore),
      avgDso: Math.round(avgDso),
      settled: settled.length,
      disputed: disputed.length,
      overdue: overdue.length,
      total,
    },
  };
}

/** GET /api/sellers — buyer sees all sellers with reliability scores */
export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.user.userType !== "Buyer") {
    return errorResponse("FORBIDDEN", "Only buyers can list sellers", 403, auth.requestId);
  }
  const now = new Date();

  await dbConnect();

  // Find all active connections for this buyer (company-wide)
  const connections = await CounterpartyLink.find({
    status: "active",
    $or: [
      { inviterCompanyId: auth.companyId, linkType: "vendor" },
      { inviteeCompanyId: auth.companyId, linkType: "buyer" },
      { inviteeId: auth.user._id, linkType: "buyer" } // Fallback for old records
    ]
  }).lean();

  const sellerIds = connections.map(c => 
    (String(c.inviterCompanyId) === String(auth.companyId) || String(c.inviterId) === String(auth.user._id)) 
      ? c.inviteeId 
      : c.inviterId
  ).filter(Boolean);

  if (!sellerIds.length) {
    return successResponse({ sellers: [] }, 200, auth.requestId);
  }

  const sellers = await User.find({ _id: { $in: sellerIds }, userType: "Seller" })
    .select("_id name companyName email gstNumber contactNumber udhyamNumber createdAt")
    .sort({ companyName: 1, name: 1 })
    .lean();

  // Load invoices for this buyer company from each seller
  const buyerInvoices = await Invoice.find({ buyerCompanyId: auth.companyId, isDeleted: false }).lean();

  const sellerMap = {};
  for (const inv of buyerInvoices) {
    const sid = String(inv.sellerId);
    if (!sellerMap[sid]) sellerMap[sid] = [];
    sellerMap[sid].push(inv);
  }

  const result = sellers.map((seller) => {
    const invoices = sellerMap[String(seller._id)] || [];
    const totalBusiness = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const { score, breakdown } = computeReliabilityScore(invoices, now);
    return {
      ...seller,
      name: seller.companyName || seller.name,
      reliabilityScore: score,
      breakdown,
      invoiceCount: invoices.length,
      totalBusiness: Math.round(totalBusiness * 100) / 100,
    };
  });

  return successResponse({ sellers: result }, 200, auth.requestId);
}
