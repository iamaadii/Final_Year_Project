import Notification from "@/models/Notification";
import { requireAuth, successResponse } from "@/lib/api/routeUtils";

export async function PATCH(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const result = await Notification.updateMany(
    {
      userId: String(auth.user._id),
      companyId: auth.companyId,
      isRead: false,
    },
    { $set: { isRead: true, readAt: new Date() } },
  );

  return successResponse({ modifiedCount: result.modifiedCount || 0 }, 200, auth.requestId);
}
