import { z } from "zod";
import dbConnect from "@/lib/db";
import CounterpartyLink from "@/models/CounterpartyLink";
import { requireAuth, parseBody, successResponse, errorResponse } from "@/lib/api/routeUtils";

const VendorSchema = z.object({
  gstin: z.string().min(15).max(15).toUpperCase(),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  // Vendors are usually added by Buyers
  if (auth.user.userType !== "Buyer") {
    return errorResponse("FORBIDDEN", "Only buyers can add vendors", 403, auth.requestId);
  }

  const parsed = await parseBody(req, VendorSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const { gstin, email, name } = parsed.data;

  try {
    await dbConnect();

    const link = await CounterpartyLink.findOneAndUpdate(
      {
        inviterCompanyId: auth.companyId,
        inviteeGstin: gstin,
        linkType: "vendor"
      },
      {
        inviterId: auth.user._id,
        inviteeEmail: email,
        inviteeGstin: gstin,
        inviteeName: name || "Unnamed Vendor",
        status: "active", // For vendors, let's assume adding them is immediate
        linkType: "vendor"
      },
      { upsert: true, new: true }
    );

    return successResponse({ message: "Vendor added successfully", linkId: link._id }, 201, auth.requestId);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse("DUPLICATE", "This vendor is already added", 400, auth.requestId);
    }
    console.error("VENDOR_ADD_ERROR:", error);
    return errorResponse("SERVER_ERROR", "Internal Server Error", 500, auth.requestId);
  }
}

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (auth.user.userType !== "Buyer") {
    return errorResponse("FORBIDDEN", "Only buyers can list vendors", 403, auth.requestId);
  }

  await dbConnect();

  const links = await CounterpartyLink.find({
    inviterCompanyId: auth.companyId,
    linkType: "vendor",
  }).sort({ createdAt: -1 }).lean();

  // Map to common frontend format
  const vendors = links.map(link => ({
    id: link._id,
    name: link.inviteeName || "Unnamed Vendor",
    email: link.inviteeEmail,
    gstin: link.inviteeGstin,
    status: link.status,
    avgPaymentDays: link.avgPaymentDays,
    totalVolume: link.totalVolume,
  }));

  return successResponse({ data: vendors }, 200, auth.requestId);
}
