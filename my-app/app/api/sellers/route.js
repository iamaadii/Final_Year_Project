import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Invoice from "@/models/Invoice";
import { getUserFromToken } from "@/lib/apiAuth";

/**
 * Compute a vendor reliability score (0-100) from invoice history.
 * Supervision: Unsupervised (weighted aggregation, no labels)
 * Learning: Batch | Approach: Model-based (statistical)
 */
function computeReliabilityScore(invoices, now) {
  if (!invoices.length) return { score: 50, breakdown: null };

  const total = invoices.length;
  const settled = invoices.filter((i) => ["Settled", "Paid"].includes(i.status));
  const disputed = invoices.filter((i) => i.status === "Disputed");
  const matched = invoices.filter((i) => i.matchResult?.decision);
  const autoApproved = matched.filter((i) => i.matchResult.decision === "AUTO_APPROVE");
  const overdue = invoices.filter((i) => new Date(i.dueDate) < now && !["Settled", "Paid"].includes(i.status));

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
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.userType !== "Buyer") {
    return NextResponse.json({ message: "Only buyers can list sellers" }, { status: 403 });
  }

  await dbConnect();
  const now = new Date();

  const sellers = await User.find({ userType: "Seller" })
    .select("_id name email gstNumber contactNumber udhyamNumber createdAt")
    .sort({ name: 1 })
    .lean();

  // Load invoices for this buyer from each seller
  const buyerInvoices = await Invoice.find({ buyerId: user._id, isDeleted: false }).lean();

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
      reliabilityScore: score,
      breakdown,
      invoiceCount: invoices.length,
      totalBusiness: Math.round(totalBusiness * 100) / 100,
    };
  });

  return NextResponse.json({ sellers: result }, { status: 200 });
}
