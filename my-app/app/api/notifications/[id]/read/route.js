import Notification from "@/models/Notification";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";

export async function POST(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const notification = await Notification.findOneAndUpdate(
    {
      _id: id,
      userId: String(auth.user._id),
      companyId: auth.companyId,
    },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true },
  );

  if (!notification) {
    return errorResponse("NOT_FOUND", "Notification not found", 404, auth.requestId);
  }

  return successResponse(notification, 200, auth.requestId);
}
