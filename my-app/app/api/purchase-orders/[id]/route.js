import { z } from "zod";
import PurchaseOrder from "@/models/PurchaseOrder";
import GRN from "@/models/GRN";
import { requireAuth, parseBody, successResponse, errorResponse, writeAudit } from "@/lib/api/routeUtils";

const UpdatePurchaseOrderSchema = z.object({
  status: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = params;
  const companyId = auth.companyId;
  const po = await PurchaseOrder.findOne({ _id: id, companyId }).lean();
  if (!po) {
    return errorResponse("NOT_FOUND", "PO not found or unauthorized", 404, auth.requestId);
  }

  // Attach linked GRNs
  const grns = await GRN.find({ poId: po._id, companyId }).lean();
  return successResponse({ purchaseOrder: { ...po, grns } }, 200, auth.requestId);
}

export async function PATCH(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.user.userType !== "Buyer") {
    return errorResponse("FORBIDDEN", "Only buyers can update purchase orders", 403, auth.requestId);
  }

  const { id } = await params;
  const po = await PurchaseOrder.findById(id);
  if (!po) return errorResponse("NOT_FOUND", "Purchase Order not found", 404, auth.requestId);
  if (String(po.buyerId) !== String(auth.user._id)) {
    return errorResponse("FORBIDDEN", "Forbidden", 403, auth.requestId);
  }

  try {
    const parsed = await parseBody(req, UpdatePurchaseOrderSchema, auth.requestId);
    if (!parsed.ok) return parsed.response;

    const { status, notes } = parsed.data;
    const validStatuses = ["Open", "Partially Received", "Fully Received", "Closed", "Cancelled"];
    if (status && !validStatuses.includes(status)) {
      return errorResponse(
        "VALIDATION_ERROR",
        `status must be one of: ${validStatuses.join(", ")}`,
        400,
        auth.requestId,
      );
    }
    if (status) po.status = status;
    if (typeof notes === "string") po.notes = notes;
    await po.save();
    await writeAudit({
      user: auth.user,
      companyId: auth.companyId,
      action: "update",
      resource: "purchase-order",
      resourceId: po._id,
      details: { status, notes },
      req,
    });

    return successResponse({ message: "Purchase Order updated", purchaseOrder: po }, 200, auth.requestId);
  } catch {
    return errorResponse("SERVER_ERROR", "Server error", 500, auth.requestId);
  }
}
