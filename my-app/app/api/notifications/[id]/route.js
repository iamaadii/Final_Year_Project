import Notification from "@/models/Notification";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";

export async function DELETE(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const deleted = await Notification.findOneAndDelete({
    _id: id,
    userId: String(auth.user._id),
    companyId: auth.companyId,
  });

  if (!deleted) {
    return errorResponse("NOT_FOUND", "Notification not found", 404, auth.requestId);
  }

  return successResponse({ deleted: true, id }, 200, auth.requestId);
}
