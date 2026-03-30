import User from "@/models/User";
import Invoice from "@/models/Invoice";
import PurchaseOrder from "@/models/PurchaseOrder";
import GRN from "@/models/GRN";
import { requireAuth, writeAudit } from "@/lib/api/routeUtils";

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const userId = String(auth.user._id);
  const companyId = auth.companyId;

  const [user, invoices, purchaseOrders, grns] = await Promise.all([
    User.findById(userId).lean(),
    Invoice.find({ companyId, $or: [{ buyerId: userId }, { sellerId: userId }] }).lean(),
    PurchaseOrder.find({ companyId, $or: [{ buyerId: userId }, { sellerId: userId }] }).lean(),
    GRN.find({ companyId, $or: [{ buyerId: userId }, { sellerId: userId }] }).lean(),
  ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    user: {
      _id: user?._id,
      name: user?.name,
      email: user?.email,
      userType: user?.userType,
      role: user?.role,
      companyId: user?.companyId,
      companyName: user?.companyName,
      contactNumber: user?.contactNumber,
      whatsappNumber: user?.whatsappNumber,
      dpdpConsentVersion: user?.dpdpConsentVersion,
      dpdpConsentTimestamp: user?.dpdpConsentTimestamp,
      dpdpConsentPurposes: user?.dpdpConsentPurposes || [],
      createdAt: user?.createdAt,
      updatedAt: user?.updatedAt,
    },
    invoices,
    purchaseOrders,
    grns,
  };

  await writeAudit({
    user: auth.user,
    companyId,
    action: "dpdp_data_export_requested",
    resource: "User",
    resourceId: userId,
    details: {
      invoiceCount: invoices.length,
      poCount: purchaseOrders.length,
      grnCount: grns.length,
    },
    req,
  });

  return new Response(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename=dpdp-export-${userId}.json`,
      "X-Request-ID": auth.requestId,
    },
  });
}
