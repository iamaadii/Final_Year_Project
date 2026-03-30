import { Worker } from "bullmq";
import { z } from "zod";
import { connectDB } from "@/lib/db/client";
import { bullConnection, erpSyncQueue } from "@/lib/workers/queue";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { log } from "@/lib/monitoring/logger";

const ErpSyncJobSchema = z.object({
  requestId: z.string().min(1),
  userId: z.string().min(1),
  companyId: z.string().min(1),
  provider: z.enum(["tally", "zoho-books"]),
  trigger: z.enum(["manual", "scheduled"]).default("manual"),
});

type ErpSyncJob = z.infer<typeof ErpSyncJobSchema>;

async function testTallyConnection(host?: string, port?: number) {
  const resolvedHost = String(host || "").trim();
  const resolvedPort = Number(port || 9000);

  if (!resolvedHost) {
    return { ok: false, message: "Tally host is not configured." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const url = `http://${resolvedHost}:${Number.isFinite(resolvedPort) ? resolvedPort : 9000}`;

  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    if (!res.ok) {
      return { ok: false, message: `Tally endpoint responded with status ${res.status}.` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to reach Tally endpoint." };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function processErpSyncJob(data: ErpSyncJob) {
  await connectDB();

  const user = await User.findById(data.userId);
  if (!user) {
    return { synced: false, reason: "user_not_found" };
  }

  const now = new Date();
  if (data.provider === "tally") {
    const testResult = await testTallyConnection(user.tallyConfig?.host, user.tallyConfig?.port);

    if (!testResult.ok) {
      const nextErrors = [
        { message: testResult.message || "Tally connection failed", timestamp: now },
        ...((user.tallyConfig?.syncErrors || []).slice(0, 4)),
      ];
      user.tallyConfig = {
        ...(user.tallyConfig || {}),
        syncEnabled: false,
        lastSyncAt: now,
        lastSyncStatus: "failed",
        syncErrors: nextErrors,
      };
      await user.save();
      await Notification.create({
        userId: String(user._id),
        companyId: data.companyId,
        type: "erp_sync_failed",
        priority: "high",
        title: "Tally sync failed",
        body: testResult.message || "Unable to reach Tally endpoint.",
        entityType: "Integration",
        entityId: "tally",
        actionUrl: "/buyer/settings/integrations",
        metadata: {
          provider: "tally",
          trigger: data.trigger,
          failedAt: now.toISOString(),
        },
      });
      return { synced: false, reason: "tally_connection_failed", message: testResult.message };
    }

    user.tallyConfig = {
      ...(user.tallyConfig || {}),
      syncEnabled: true,
      lastSyncAt: now,
      lastSyncStatus: "success",
    };
  } else {
    user.zohoBooksConfig = {
      ...(user.zohoBooksConfig || {}),
      syncEnabled: true,
      lastSyncAt: now,
      lastSyncStatus: "success",
    };
  }

  await user.save();

  await Notification.create({
    userId: String(user._id),
    companyId: data.companyId,
    type: "erp_sync_success",
    priority: "medium",
    title: `${data.provider === "tally" ? "Tally" : "Zoho Books"} sync completed`,
    body: `ERP sync completed via ${data.trigger} trigger.`,
    entityType: "Integration",
    entityId: data.provider,
    actionUrl: "/buyer/settings/integrations",
    metadata: {
      provider: data.provider,
      trigger: data.trigger,
      syncedAt: now.toISOString(),
    },
  });

  return {
    synced: true,
    provider: data.provider,
    syncedAt: now.toISOString(),
    trigger: data.trigger,
  };
}

const worker = new Worker(
  "q.erp.sync",
  async (job) => {
    const parsed = ErpSyncJobSchema.parse(job.data);
    log.info({ requestId: parsed.requestId, companyId: parsed.companyId, jobId: String(job.id) }, "ERP sync job started");

    const result = await processErpSyncJob(parsed);

    log.info({ requestId: parsed.requestId, companyId: parsed.companyId, jobId: String(job.id), result }, "ERP sync job completed");
    return result;
  },
  {
    connection: bullConnection,
    concurrency: Number(process.env.WORKER_CONCURRENCY_ERP_SYNC || 5),
  },
);

worker.on("failed", (job, error) => {
  log.error(
    {
      requestId: String(job?.data?.requestId || "unknown"),
      companyId: String(job?.data?.companyId || "unknown"),
      jobId: String(job?.id || "unknown"),
      error,
    },
    "ERP sync job failed",
  );
});

worker.on("ready", () => {
  log.info({ requestId: "system", companyId: "system" }, "ERP sync worker ready");
});

process.on("SIGTERM", async () => {
  await worker.close();
  await erpSyncQueue.close();
  process.exit(0);
});
