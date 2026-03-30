import { z } from "zod";
import Notification from "@/models/Notification";
import {
  requireAuth,
  successResponse,
  errorResponse,
  commonQuerySchema,
} from "@/lib/api/routeUtils";

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const query = commonQuerySchema.extend({
    unreadOnly: z.enum(["true", "false"]).optional(),
    type: z.string().optional(),
  }).safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));

  if (!query.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid query params", 400, auth.requestId, query.error.flatten());
  }

  const filter = {
    userId: String(auth.user._id),
    companyId: auth.companyId,
  };

  if (query.data.unreadOnly === "true") filter.isRead = false;
  if (query.data.type) filter.type = query.data.type;

  const skip = (query.data.page - 1) * query.data.limit;
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.data.limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: String(auth.user._id), companyId: auth.companyId, isRead: false }),
  ]);

  return successResponse({ items, page: query.data.page, limit: query.data.limit, total, unreadCount }, 200, auth.requestId);
}
