import dbConnect from "@/lib/db";
import CounterpartyLink from "@/models/CounterpartyLink";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.user.userType !== "Seller") {
    return errorResponse("FORBIDDEN", "Only sellers can list buyers", 403, auth.requestId);
  }

  await dbConnect();

  const links = await CounterpartyLink.find({
    inviterCompanyId: auth.companyId,
    linkType: "buyer",
  }).sort({ createdAt: -1 }).lean();

  const buyers = links.map(link => ({
    id: link._id,
    name: link.inviteeName || "Pending Buyer",
    email: link.inviteeEmail,
    gstin: link.inviteeGstin,
    status: link.status,
    avgPaymentDays: link.avgPaymentDays,
    totalVolume: link.totalVolume,
  }));

  return successResponse({ data: buyers }, 200, auth.requestId);
}
