import dbConnect from "@/lib/db";
import CounterpartyLink from "@/models/CounterpartyLink";
import { requireAuth, successResponse, errorResponse, parseBody } from "@/lib/api/routeUtils";
import { sendNotification } from "@/lib/notifications";
import { z } from "zod";

const ToggleSchema = z.object({
  linkId: z.string().min(1),
  isFinancingVisible: z.boolean()
});

export async function PATCH(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = await parseBody(req, ToggleSchema, auth.requestId);
    if (!parsed.ok) return parsed.response;

    const { linkId, isFinancingVisible } = parsed.data;

    await dbConnect();

    // 1. Find the link
    const link = await CounterpartyLink.findById(linkId);
    if (!link) {
      return errorResponse("NOT_FOUND", "Connection not found", 404, auth.requestId);
    }

    // 2. Authorization Check:
    // Only the BUYER can toggle visibility for their Vendor.
    // If linkType is "vendor", the inviter is the Buyer.
    // If linkType is "buyer", the invitee is the Buyer.
    
    // We assume the user calling this is an 'enterprise_admin' or similar role.
    // For simplicity, we check if they are one side of the link and their role is 'buyer'.
    if (auth.user.userType !== "Buyer") {
      return errorResponse("FORBIDDEN", "Only buyers can toggle financing visibility", 403, auth.requestId);
    }

    const isMember = String(link.inviterId) === auth.user._id || String(link.inviteeId) === auth.user._id;
    if (!isMember) {
      return errorResponse("FORBIDDEN", "You are not a member of this connection", 403, auth.requestId);
    }

    // 3. Update visibility
    link.isFinancingVisible = isFinancingVisible;
    await link.save();

    // 4. Notify the Seller
    // Determine who the seller is
    const sellerId = String(link.inviterId) === auth.user._id ? link.inviteeId : link.inviterId;
    
    if (sellerId && isFinancingVisible) {
      await sendNotification({
        userId: String(sellerId),
        companyId: String(link.inviterCompanyId === auth.companyId ? (link.inviteeId === sellerId ? link.inviteeId : link.inviterId) : auth.companyId), // Simplified companyId
        type: "financing_approved",
        title: "Financing Visibility Unlocked",
        body: `${auth.user.companyName || auth.user.name} has enabled financing visibility for your connection.`,
        actionUrl: "/seller/invoices"
      });
    }

    return successResponse({ 
      message: `Financing visibility ${isFinancingVisible ? 'enabled' : 'disabled'}`, 
      isFinancingVisible 
    }, 200, auth.requestId);

  } catch (err) {
    return errorResponse("SERVER_ERROR", err.message, 500, auth.requestId);
  }
}
