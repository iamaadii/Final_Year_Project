import Invoice from "@/models/Invoice";
import TreasuryConfig from "@/models/TreasuryConfig";
import { requireAuth, successResponse } from "@/lib/api/routeUtils";

function toOffer(inv, targetApr) {
  const now = Date.now();
  const dueTs = inv.dueDate ? new Date(inv.dueDate).getTime() : now;
  const daysEarly = Math.max(1, Math.ceil((dueTs - now) / (1000 * 60 * 60 * 24)));
  const invoiceValue = Number(inv.totalAmount || 0);
  const impliedApr = Number(inv?.discountOffer?.discountRate ?? targetApr ?? 0);
  const modeledDiscount = Math.round((impliedApr / 36500) * daysEarly * invoiceValue);
  const netPayout = Number(inv?.discountOffer?.earlyPaymentAmount ?? invoiceValue - modeledDiscount);

  return {
    id: String(inv._id),
    vendorName: inv.sellerName || inv.buyerName || "Counterparty",
    invoiceNumber: inv.invoiceNumber || "",
    invoiceValue,
    impliedApr,
    netPayout,
    paymentLinkUrl: inv.paymentLinkUrl || null,
  };
}

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const config = await TreasuryConfig.findOne({ companyId: auth.companyId }).lean();
  const targetApr = Number(config?.targetApr || 0);

  const invoices = await Invoice.find({
    companyId: auth.companyId,
    isDeleted: false,
    status: { $in: ["Approved", "Pending Approval", "Overdue"] },
  })
    .select("_id sellerName buyerName invoiceNumber totalAmount dueDate status discountOffer paymentLinkUrl")
    .sort({ dueDate: 1, createdAt: -1 })
    .limit(200)
    .lean();

  const offers = invoices.map((inv) => toOffer(inv, targetApr));

  return successResponse(
    {
      data: offers,
      total: offers.length,
    },
    200,
    auth.requestId,
  );
}
