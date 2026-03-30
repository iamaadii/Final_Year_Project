import { requireAuth, successResponse, writeAudit, createNotification } from "@/lib/api/routeUtils";
import { addJob, erpSyncQueue } from "@/lib/workers/queue";

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const now = new Date();
  const queuedJob = await addJob(
    erpSyncQueue,
    {
      requestId: auth.requestId,
      userId: String(auth.user._id),
      companyId: auth.companyId,
      provider: "tally",
      trigger: "manual",
    },
    {
      jobId: `erp-sync:tally:${String(auth.user._id)}:${now.toISOString().slice(0, 13)}`,
    },
    "erp-sync",
  );

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "tally_sync_triggered",
    resource: "Integration",
    resourceId: String(auth.user._id),
    details: { triggeredAt: now.toISOString() },
    req,
  });

  await createNotification({
    userId: auth.user._id,
    companyId: auth.companyId,
    type: "system",
    priority: "medium",
    title: "Tally sync queued",
    body: "Tally sync job has been queued and will run in background.",
    entityType: "Integration",
    entityId: "tally",
    actionUrl: "/buyer/settings/integrations",
  });

  return successResponse({ queued: true, provider: "tally", queuedAt: now, jobId: String(queuedJob.id) }, 202, auth.requestId);
}
