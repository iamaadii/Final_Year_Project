import dbConnect from "@/lib/db";
import User from "@/models/User";
import CounterpartyLink from "@/models/CounterpartyLink";
import { requireAuth, successResponse, errorResponse, parseBody } from "@/lib/api/routeUtils";
import { sendNotification } from "@/lib/notifications";
import { z } from "zod";

const InviteSchema = z.object({
  gstin: z.string().min(15, "Valid GSTIN is required").max(15),
  email: z.string().email().optional().or(z.literal("")),
  name: z.string().min(1, "Business name is required"),
  linkType: z.enum(["buyer", "vendor"]), // From inviter's perspective
});

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(req, InviteSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const { gstin, email, name, linkType } = parsed.data;

  try {
    await dbConnect();

    // 1. Check if the target user already exists
    let invitee = null;
    if (gstin) {
      invitee = await User.findOne({ gstNumber: gstin.toUpperCase() });
    } else if (email) {
      invitee = await User.findOne({ email: email.toLowerCase().trim() });
    }

    // 2. Prevent self-invitation
    if (invitee && String(invitee._id) === auth.user._id) {
      return errorResponse("VALIDATION_ERROR", "You cannot invite yourself", 400, auth.requestId);
    }

    // 3. Check for existing link
    const existingLink = await CounterpartyLink.findOne({
      inviterCompanyId: auth.companyId,
      $or: [
        { inviteeGstin: gstin?.toUpperCase() },
        { inviteeEmail: email?.toLowerCase().trim() },
        { inviteeId: invitee?._id }
      ].filter(Boolean)
    });

    if (existingLink) {
      return errorResponse("DUPLICATE", "A connection or invite already exists for this counterparty", 400, auth.requestId);
    }

    // 4. Create the link
    const newLink = await CounterpartyLink.create({
      inviterId: auth.user._id,
      inviterCompanyId: auth.companyId,
      inviteeId: invitee?._id || null,
      inviteeCompanyId: invitee?.companyId || invitee?.effectiveCompanyId || null,
      inviteeGstin: gstin?.toUpperCase() || "",
      inviteeEmail: email?.toLowerCase().trim() || "",
      inviteeName: name,
      linkType,
      status: "pending"
    });
    
    // 5. Send notification if invitee exists
    if (invitee) {
      await sendNotification({
        userId: String(invitee._id),
        companyId: String(invitee.companyId || invitee._id),
        type: "connection_invite",
        title: "New Connection Request",
        body: `${auth.user.companyName || auth.user.name} has invited you to connect.`,
        actionUrl: invitee.role === "buyer" ? "/buyer/vendors" : "/seller/counterparties"
      });
    }

    return successResponse({ 
      message: "Invitation sent successfully", 
      linkId: newLink._id,
      isRegistered: !!invitee 
    }, 201, auth.requestId);

  } catch (err) {
    return errorResponse("SERVER_ERROR", err.message, 500, auth.requestId);
  }
}

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    await dbConnect();

    // We fetch both:
    // 1. Invites WE sent (inviterCompanyId)
    // 2. Invites WE received (inviteeId or inviteeEmail or inviteeGstin matches our company profile)
    
    // For Received invites, we check our email and GSTIN
    const me = await User.findById(auth.user._id);
    const myGstin = me.gstNumber;
    const myEmail = me.email;

    const links = await CounterpartyLink.find({
      $or: [
        { inviterCompanyId: auth.companyId },
        { inviteeCompanyId: auth.companyId },
        { inviteeId: auth.user._id },
        { inviteeEmail: myEmail },
        { inviteeGstin: myGstin }
      ]
    }).populate("inviterId", "name email companyName gstNumber")
      .populate("inviteeId", "name email companyName gstNumber")
      .lean();

    const myId = String(auth.user._id);
    const myCompId = auth.companyId ? String(auth.companyId) : null;

    const enrichedLinks = links.map(link => {
      // Determine if I am the inviter or invitee
      const isInviter = String(link.inviterId?._id || link.inviterId) === myId || (myCompId && String(link.inviterCompanyId) === myCompId);
      
      let partnerName = "";
      let partnerGstin = "";
      let partnerEmail = "";
      let adjustedLinkType = link.linkType;

      if (isInviter) {
        // I invited them. The partner is the invitee.
        partnerName = link.inviteeId?.companyName || link.inviteeId?.name || link.inviteeName || "Unnamed Partner";
        partnerGstin = link.inviteeId?.gstNumber || link.inviteeGstin || "";
        partnerEmail = link.inviteeId?.email || link.inviteeEmail || "";
      } else {
        // They invited me. The partner is the inviter.
        partnerName = link.inviterId?.companyName || link.inviterId?.name || "Unnamed Partner";
        partnerGstin = link.inviterId?.gstNumber || "";
        partnerEmail = link.inviterId?.email || "";
        // Invert linkType for UI: if they invited me as "buyer", then for me they are a "vendor"
        adjustedLinkType = link.linkType === "buyer" ? "vendor" : "buyer";
      }

      return {
        ...link,
        partnerName,
        partnerGstin,
        partnerEmail,
        adjustedLinkType
      };
    });

    return successResponse({ links: enrichedLinks }, 200, auth.requestId);
  } catch (err) {
    return errorResponse("SERVER_ERROR", err.message, 500, auth.requestId);
  }
}
