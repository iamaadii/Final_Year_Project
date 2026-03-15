import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { get43BhBucket } from "@/lib/complianceCalc";
import { getUserFromToken } from "@/lib/apiAuth";

export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.userType !== "Buyer") {
    return NextResponse.json({ message: "Only buyers can view 43B(h) radar" }, { status: 403 });
  }

  await dbConnect();
  const companyId = user.effectiveCompanyId;
  if (!companyId) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  // Get all unpaid invoices for this buyer with isolation
  const invoices = await Invoice.find({
    companyId,
    isDeleted: false,
    status: { $nin: ["Settled", "Paid", "Draft"] },
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

    const item = {
      _id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      sellerName: inv.sellerName,
      totalAmount: inv.totalAmount,
      issueDate: inv.issueDate,
      daysSince,
      dueDate: inv.dueDate,
      status: inv.status,
    };

    buckets[bucket].push(item);

    if (bucket === "breached") {
      totalTaxExposure += inv.totalAmount;
    }
  }

  return NextResponse.json({
    buckets,
    summary: {
      safe: buckets.safe.length,
      approaching: buckets.approaching.length,
      at_risk: buckets.at_risk.length,
      breached: buckets.breached.length,
      total: invoices.length,
      totalTaxExposure: Math.round(totalTaxExposure * 100) / 100,
    },
  });
}
