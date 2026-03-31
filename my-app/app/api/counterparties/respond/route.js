import dbConnect from "@/lib/db";
import User from "@/models/User";
import CounterpartyLink from "@/models/CounterpartyLink";
import { requireAuth, successResponse, errorResponse, parseBody } from "@/lib/api/routeUtils";
import { sendNotification } from "@/lib/notifications";
import { z } from "zod";

const RespondSchema = z.object({
  linkId: z.string().min(1),
  action: z.enum(["accept", "reject"]),
});

export async function PATCH(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    await dbConnect();
    const parsed = await parseBody(req, RespondSchema, auth.requestId);
    if (!parsed.ok) return parsed.response;

    const { linkId, action } = parsed.data;

    // 1. Find the link and verify the current user is the invitee
    const link = await CounterpartyLink.findById(linkId);
    if (!link) {
      return errorResponse("NOT_FOUND", "Invitation not found", 404, auth.requestId);
    }

    // Authorization: Only the invitee can respond
    const me = await User.findById(auth.user._id);
    const isInvitee = 
      String(link.inviteeId) === auth.user._id || 
      (link.inviteeEmail && link.inviteeEmail.toLowerCase() === me.email.toLowerCase()) ||
      (link.inviteeGstin && link.inviteeGstin.toUpperCase() === me.gstNumber.toUpperCase());

    if (!isInvitee) {
      return errorResponse("FORBIDDEN", "You are not authorized to respond to this invitation", 403, auth.requestId);
    }

    if (link.status !== "pending") {
      return errorResponse("BAD_REQUEST", `This invitation is already ${link.status}`, 400, auth.requestId);
    }

    // 2. Perform the action
    if (action === "accept") {
      link.status = "active";
      // Ensure inviteeId and inviteeCompanyId are set for future lookups
      link.inviteeId = auth.user._id;
      link.inviteeCompanyId = auth.user.companyId || auth.user.effectiveCompanyId;
      await link.save();

      // Notify inviter
      await sendNotification({
        userId: String(link.inviterId),
        companyId: String(link.inviterCompanyId),
        type: "connection_accepted",
        title: "Connection Request Accepted",
        body: `${auth.user.companyName || auth.user.name} has accepted your connection request.`,
        actionUrl: link.linkType === "buyer" ? "/seller/counterparties" : "/buyer/vendors"
      });

      return successResponse({ message: "Connection established successfully", status: "active" }, 200, auth.requestId);
    } else {
      link.status = "rejected";
      await link.save();

      // Notify inviter
      await sendNotification({
        userId: String(link.inviterId),
        companyId: String(link.inviterCompanyId),
        type: "approval_rejected",
        title: "Connection Request Declined",
        body: `${auth.user.companyName || auth.user.name} has declined your connection request.`,
        actionUrl: link.linkType === "buyer" ? "/seller/counterparties" : "/buyer/vendors"
      });

      return successResponse({ message: "Invitation rejected", status: "rejected" }, 200, auth.requestId);
    }

  } catch (err) {
    return errorResponse("SERVER_ERROR", err.message, 500, auth.requestId);
  }
}
