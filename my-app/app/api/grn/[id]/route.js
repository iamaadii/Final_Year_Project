import GRN from "@/models/GRN";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";

export async function GET(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = params;
  const companyId = auth.companyId;
  const grn = await GRN.findOne({ _id: id, companyId }).lean();
  
  if (!grn) {
    return errorResponse("NOT_FOUND", "GRN not found or unauthorized access", 404, auth.requestId);
  }

  return successResponse({ grn }, 200, auth.requestId);
}
