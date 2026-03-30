import User from "@/models/User";
import { requireAuth, successResponse } from "@/lib/api/routeUtils";

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const user = await User.findById(auth.user._id).lean();

  return successResponse({
    tally: {
      syncEnabled: Boolean(user?.tallyConfig?.syncEnabled),
      lastSyncAt: user?.tallyConfig?.lastSyncAt || null,
      lastSyncStatus: user?.tallyConfig?.lastSyncStatus || null,
      host: user?.tallyConfig?.host || "",
      companyName: user?.tallyConfig?.companyName || "",
      port: Number(user?.tallyConfig?.port || 9000),
    },
    zohoBooks: {
      syncEnabled: Boolean(user?.zohoBooksConfig?.syncEnabled),
      lastSyncAt: user?.zohoBooksConfig?.lastSyncAt || null,
      lastSyncStatus: user?.zohoBooksConfig?.lastSyncStatus || null,
      orgId: user?.zohoBooksConfig?.orgId || "",
      connected: Boolean(user?.zohoBooksConfig?.accessToken),
    },
  }, 200, auth.requestId);
}
