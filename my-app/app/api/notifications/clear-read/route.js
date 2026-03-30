import Notification from "@/models/Notification";
import { requireAuth, successResponse } from "@/lib/api/routeUtils";

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const result = await Notification.deleteMany({
    userId: String(auth.user._id),
    companyId: auth.companyId,
    isRead: true,
  });

  return successResponse({ deletedCount: result.deletedCount || 0 }, 200, auth.requestId);
}
