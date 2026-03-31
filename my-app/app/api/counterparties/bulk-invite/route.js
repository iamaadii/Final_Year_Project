import dbConnect from "@/lib/db";
import User from "@/models/User";
import CounterpartyLink from "@/models/CounterpartyLink";
import { requireAuth, successResponse, errorResponse, parseBody } from "@/lib/api/routeUtils";
import { sendNotification } from "@/lib/notifications";
import { z } from "zod";

const BulkInviteSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1),
    gstin: z.string().min(15).max(15).toUpperCase(),
    email: z.string().email().optional().or(z.literal(""))
  })),
  linkType: z.enum(["buyer", "vendor"]), // From inviter's perspective
});

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = await parseBody(req, BulkInviteSchema, auth.requestId);
    if (!parsed.ok) return parsed.response;

    const { items, linkType } = parsed.data;

    await dbConnect();

    // 1. Fetch current links to avoid duplicates
    const existingLinks = await CounterpartyLink.find({
      inviterCompanyId: auth.companyId,
      linkType
    }).select("inviteeGstin -_id");

    const existingGstins = new Set(existingLinks.map(l => l.inviteeGstin));

    // 2. Prepare items for insertion
    const toInsert = [];
    const skipped = [];
    const targetGstins = items.map(i => i.gstin);

    // 3. Find registered users among the target GSTINs
    const registeredUsers = await User.find({
      gstNumber: { $in: targetGstins }
    }).select("_id gstNumber companyId companyName name role");

    const userMap = new Map(registeredUsers.map(u => [u.gstNumber, u]));

    for (const item of items) {
      if (existingGstins.has(item.gstin)) {
        skipped.push(item.gstin);
        continue;
      }

      const registeredUser = userMap.get(item.gstin);
      
      toInsert.push({
        inviterId: auth.user._id,
        inviterCompanyId: auth.companyId,
        inviteeId: registeredUser?._id || null,
        inviteeGstin: item.gstin,
        inviteeEmail: item.email || "",
        inviteeName: item.name,
        linkType,
        status: "pending"
      });
    }

    if (toInsert.length === 0) {
      return successResponse({ 
        message: "No new counterparties to onboard.", 
        onboardedCount: 0, 
        skippedCount: skipped.length 
      }, 200, auth.requestId);
    }

    // 4. Batch Insert
    const results = await CounterpartyLink.insertMany(toInsert, { ordered: false });

    // 5. Send Notifications to registered users
    const notificationPromises = toInsert
      .filter(item => item.inviteeId)
      .map(item => {
        const user = userMap.get(item.inviteeGstin);
        return sendNotification({
          userId: String(user._id),
          companyId: String(user.companyId || user._id),
          type: "connection_invite",
          title: "New Connection Request",
          body: `${auth.user.companyName || auth.user.name} has invited you to connect.`,
          actionUrl: user.role === "buyer" ? "/buyer/vendors" : "/seller/counterparties"
        });
      });

    await Promise.all(notificationPromises);

    return successResponse({ 
      message: `Successfully onboarded ${results.length} counterparties.`, 
      onboardedCount: results.length,
      skippedCount: skipped.length
    }, 201, auth.requestId);

  } catch (err) {
    return errorResponse("SERVER_ERROR", err.message, 500, auth.requestId);
  }
}
