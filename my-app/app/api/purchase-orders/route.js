import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PurchaseOrder from "@/models/PurchaseOrder";
import { requireAuth, parseBody, successResponse, errorResponse, writeAudit } from "@/lib/api/routeUtils";

const PurchaseOrderSchema = z.object({
  poNumber: z.string().min(1),
  sellerId: z.string().min(1),
  lineItems: z.array(z.any()).optional(),
  totalAmount: z.number().optional(),
  notes: z.string().optional(),
});

/**
 * GET: List POs for the authenticated company
 */
export async function GET(req) {
  await dbConnect();
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const team = await User.find({ 
    $or: [
      { _id: auth.companyId },
      { companyId: auth.companyId }
    ] 
  }).select("_id").lean();
  const teamIds = team.map(u => u._id);

  const query = {
    isDeleted: false,
    $or: [
      { buyerCompanyId: auth.companyId },
      { sellerCompanyId: auth.companyId },
      { companyId: auth.companyId },
      { buyerId: { $in: teamIds } },
      { sellerId: { $in: teamIds } }
    ]
  };

  const pos = await PurchaseOrder.find(query)
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
    
  return successResponse({ purchaseOrders: pos }, 200, auth.requestId);
}

/**
 * POST: Create a new PO (Buyer only)
 */
export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.user.userType !== "Buyer") {
    return errorResponse("FORBIDDEN", "Only buyers can create POs", 403, auth.requestId);
  }

  const parsed = await parseBody(req, PurchaseOrderSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  try {
    const { poNumber, sellerId, lineItems = [], totalAmount, notes = "" } = parsed.data;

    await dbConnect();
    const seller = await User.findById(sellerId);
    if (!seller) return errorResponse("NOT_FOUND", "Seller not found", 404, auth.requestId);

    const companyId = auth.companyId;

    const sellerCompanyId = seller.companyId || seller.effectiveCompanyId || seller._id;
    // sellerCompanyId will always have a value because seller._id is guaranteed by User.findById success above


    const po = await PurchaseOrder.create({
      poNumber: String(poNumber).trim(),
      buyerId: auth.user._id,
      sellerId: seller._id,
      buyerCompanyId: auth.companyId,
      sellerCompanyId,
      companyId: auth.companyId, // Ownership link
      buyerName: auth.user.companyName || auth.user.name,
      sellerName: seller.companyName || seller.name,
      lineItems,
      totalAmount: Number(totalAmount) || 0,
      notes,
    });

    await writeAudit({
      user: auth.user,
      companyId,
      action: "purchase_order_created",
      resource: "PurchaseOrder",
      resourceId: po._id,
      details: { poNumber: po.poNumber, sellerId },
      req,
    });

    return successResponse({ purchaseOrder: po }, 201, auth.requestId);
  } catch (error) {
    const dup = error?.code === 11000;
    return errorResponse(
      dup ? "DUPLICATE" : "SERVER_ERROR",
      dup ? "PO number already exists" : "Server error",
      dup ? 409 : 500,
      auth.requestId,
    );
  }
}
