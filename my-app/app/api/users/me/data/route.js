import User from "@/models/User";
import { requireAuth, successResponse, writeAudit } from "@/lib/api/routeUtils";

export async function DELETE(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const now = new Date();
  const scheduled = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await User.findByIdAndUpdate(auth.user._id, {
    $set: {
      deletionRequestedAt: now,
      deletionScheduledAt: scheduled,
    },
  });

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "dpdp_data_deletion_requested",
    resource: "User",
    resourceId: auth.user._id,
    details: { scheduledAt: scheduled.toISOString() },
    req,
  });

  return successResponse({
    requested: true,
    deletionRequestedAt: now,
    deletionScheduledAt: scheduled,
    retentionWindowDays: 7,
  }, 200, auth.requestId);
}
