import dbConnect from "@/lib/db";
import User from "@/models/User";
import CounterpartyLink from "@/models/CounterpartyLink";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";

/** GET /api/buyers — seller sees their active connected buyers */
export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  
  if (auth.user.userType !== "Seller") {
    return errorResponse("FORBIDDEN", "Only sellers can list buyers", 403, auth.requestId);
  }

  try {
    await dbConnect();

    // Find all active connections for this seller (where they are the inviter or the invitee)
    const connections = await CounterpartyLink.find({
      $or: [
        { inviterCompanyId: auth.companyId, linkType: "buyer", status: "active" },
        { inviteeId: auth.user._id, status: "active" }
      ]
    }).lean();

    const buyerIds = connections.map(c => 
      String(c.inviterId) === auth.user._id ? c.inviteeId : c.inviterId
    ).filter(Boolean);

    if (!buyerIds.length) {
      return successResponse({ buyers: [] }, 200, auth.requestId);
    }

    const buyers = await User.find({ _id: { $in: buyerIds }, userType: "Buyer" })
      .select("_id name companyName email gstNumber contactNumber createdAt")
      .sort({ companyName: 1, name: 1 })
      .lean();

    return successResponse({ buyers }, 200, auth.requestId);
  } catch (err) {
    return errorResponse("SERVER_ERROR", err.message, 500, auth.requestId);
  }
}
