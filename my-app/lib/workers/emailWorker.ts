import { Worker } from "bullmq";
import { z } from "zod";
import { bullConnection, emailQueue } from "@/lib/workers/queue";
import { sendEmail } from "@/lib/email";
import { log } from "@/lib/monitoring/logger";

const EmailJobSchema = z.object({
  to: z.string().min(1),
  subject: z.string().min(1),
  html: z.string().min(1),
  requestId: z.string().optional(),
});

type EmailJob = z.infer<typeof EmailJobSchema>;

async function processEmailJob(data: EmailJob) {
  await sendEmail({ to: data.to, subject: data.subject, html: data.html });
  return { sent: true };
}

const worker = new Worker(
  "q.email",
  async (job) => {
    const parsed = EmailJobSchema.parse(job.data);
    const requestId = parsed.requestId || "system";

    log.info({ requestId, jobId: String(job.id), to: parsed.to }, "Email job started");

    const result = await processEmailJob(parsed);

    log.info({ requestId, jobId: String(job.id), result }, "Email job completed");
    return result;
  },
  {
    connection: bullConnection,
    concurrency: Number(process.env.WORKER_CONCURRENCY_EMAIL || 10),
  },
);

worker.on("failed", (job, error) => {
  log.error(
    {
      requestId: String(job?.data?.requestId || "unknown"),
      jobId: String(job?.id || "unknown"),
      error,
    },
    "Email job failed",
  );
});

worker.on("ready", () => {
  log.info({ requestId: "system" }, "Email worker ready");
});

process.on("SIGTERM", async () => {
  await worker.close();
  await emailQueue.close();
  process.exit(0);
});
