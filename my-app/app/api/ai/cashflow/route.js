import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { requireAuth, successResponse } from "@/lib/api/routeUtils";
import { runCashFlowForecast } from "@/lib/cashFlowForecast";

/**
 * GET /api/ai/cashflow
 * Statistical EWMA cash flow forecast.
 * Supervision: Unsupervised | Batch | Model-based (statistical)
 */
export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  await dbConnect();
  const isBuyer = user.userType === "Buyer";
  const roleFilter = isBuyer ? { buyerId: user._id } : { sellerId: user._id };

  const settled = await Invoice.find({
    ...roleFilter,
    isDeleted: false,
    status: { $in: ["Settled", "Paid", "paid"] },
    paymentReceivedAt: { $ne: null },
  }).lean();

  // For buyer: forecast outflows; for seller: forecast inflows
  const forecast = runCashFlowForecast(settled, 0.3, 3);

  // Outstanding invoices as upcoming expected cash
  const unpaid = await Invoice.find({
    ...roleFilter,
    isDeleted: false,
    status: { $in: ["Approved", "Pending Approval", "Partially Settled", "Under Review", "Overdue"] },
  }).lean();

  const now = new Date();
  const upcoming14 = unpaid.filter((i) => {
    const days = Math.ceil((new Date(i.dueDate) - now) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 14;
  }).reduce((s, i) => s + i.totalAmount, 0);
  const upcoming30 = unpaid.filter((i) => {
    const days = Math.ceil((new Date(i.dueDate) - now) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 30;
  }).reduce((s, i) => s + i.totalAmount, 0);

  return successResponse(
    {
      ...forecast,
      upcoming14Days: Math.round(upcoming14 * 100) / 100,
      upcoming30Days: Math.round(upcoming30 * 100) / 100,
      role: user.userType,
      model: "EWMA (alpha=0.3)",
    },
    200,
    auth.requestId,
  );
}
