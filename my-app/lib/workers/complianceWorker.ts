import { Worker } from "bullmq";
import { z } from "zod";
import { bullConnection, complianceQueue } from "@/lib/workers/queue";
import { runComplianceAgent } from "@/lib/workers/complianceAgent";
import { log } from "@/lib/monitoring/logger";

const ComplianceJobSchema = z.object({
  requestId: z.string().min(1),
  trigger: z.enum(["manual", "scheduled"]).default("scheduled"),
});

const worker = new Worker(
  "q.compliance",
  async (job) => {
    const parsed = ComplianceJobSchema.parse(job.data);

    log.info({ requestId: parsed.requestId, jobId: String(job.id) }, "Compliance job started");

    const result = await runComplianceAgent();

    log.info({ requestId: parsed.requestId, jobId: String(job.id), result }, "Compliance job completed");
    return result || { completed: true };
  },
  {
    connection: bullConnection,
    concurrency: Number(process.env.WORKER_CONCURRENCY_COMPLIANCE || 2),
  },
);

worker.on("failed", (job, error) => {
  log.error(
    {
      requestId: String(job?.data?.requestId || "unknown"),
      jobId: String(job?.id || "unknown"),
      error,
    },
    "Compliance job failed",
  );
});

worker.on("ready", () => {
  log.info({ requestId: "system" }, "Compliance worker ready");
});

process.on("SIGTERM", async () => {
  await worker.close();
  await complianceQueue.close();
  process.exit(0);
});
