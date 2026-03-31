import { z } from "zod";
import dbConnect from "@/lib/db";
import GRN from "@/models/GRN";
import User from "@/models/User";
import { requireAuth, parseBody, successResponse, errorResponse, writeAudit } from "@/lib/api/routeUtils";

const GrnSchema = z.object({
  grnNumber: z.string().min(1),
  poId: z.string().min(1),
  sellerId: z.string().min(1),
  lineItems: z.array(z.any()).optional(),
  qualityCheckPassed: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function GET(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = params;
  await dbConnect();

  const query = {
    _id: id,
    $or: [
      { buyerCompanyId: auth.companyId },
      { sellerCompanyId: auth.companyId },
      { companyId: auth.companyId }, // Ownership
      { buyerId: auth.user._id },
      { sellerId: auth.user._id }
    ]
  };

  const grn = await GRN.findOne(query).lean();
  
  if (!grn) {
    return errorResponse("NOT_FOUND", "GRN not found or unauthorized access", 404, auth.requestId);
  }

  return successResponse({ grn }, 200, auth.requestId);
}

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.user.userType !== "Buyer") {
    return errorResponse("FORBIDDEN", "Only buyers can create GRNs", 403, auth.requestId);
  }

  const parsed = await parseBody(req, GrnSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  try {
    const { grnNumber, poId, sellerId, lineItems = [], qualityCheckPassed = true, notes = "" } = parsed.data;

    await dbConnect();
    const seller = await User.findById(sellerId);
    if (!seller) return errorResponse("NOT_FOUND", "Seller not found", 404, auth.requestId);

    const companyId = auth.companyId;

    const grn = await GRN.create({
      grnNumber: String(grnNumber).trim(),
      poId,
      buyerId: auth.user._id,
      sellerId: seller._id,
      buyerCompanyId: auth.companyId,
      sellerCompanyId: seller.companyId || seller.effectiveCompanyId,
      companyId: auth.companyId, // Ownership link
      buyerName: auth.user.companyName || auth.user.name,
      sellerName: seller.companyName || seller.name,
      lineItems,
      qualityCheckPassed,
      notes,
    });

    await writeAudit({
      user: auth.user,
      companyId,
      action: "grn_created",
      resource: "GRN",
      resourceId: grn._id,
      details: { grnNumber: grn.grnNumber, poId },
      req,
    });

    return successResponse({ grn }, 201, auth.requestId);
  } catch (error) {
    const dup = error?.code === 11000;
    return errorResponse(
      dup ? "DUPLICATE" : "SERVER_ERROR",
      dup ? "GRN number already exists" : "Server error",
      dup ? 409 : 500,
      auth.requestId,
    );
  }
}
