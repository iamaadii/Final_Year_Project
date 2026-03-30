import { Worker, type JobsOptions } from "bullmq";
import { z } from "zod";
import { connectDB } from "@/lib/db/client";
import { bullConnection, reminderQueue, emailQueue } from "@/lib/workers/queue";
import { computeNextReminderAt, shouldSendReminder } from "@/lib/invoiceReminders";
import Invoice from "@/models/Invoice";
import Notification from "@/models/Notification";
import { sendEmail } from "@/lib/email";
import { log } from "@/lib/monitoring/logger";

const ReminderJobSchema = z.object({
  requestId: z.string().min(1),
  companyId: z.string().min(1),
  invoiceId: z.string().min(1),
  dryRun: z.boolean().default(false),
});

type ReminderJobData = z.infer<typeof ReminderJobSchema>;

async function enqueueEmail(to: string, subject: string, html: string) {
  const payload = { to, subject, html };
  const opts: JobsOptions = {
    attempts: 5,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: true,
    removeOnFail: false,
  };

  await emailQueue.add("payment-reminder-email", payload, opts);
}

async function processReminderJob(data: ReminderJobData) {
  await connectDB();

  const invoice = await Invoice.findOne({ _id: data.invoiceId, companyId: data.companyId, isDeleted: false });
  if (!invoice) {
    return { skipped: true, reason: "invoice_not_found" };
  }

  if (!shouldSendReminder(invoice, new Date())) {
    return { skipped: true, reason: "not_due" };
  }

  if (!data.dryRun) {
    const subject = `Payment delay reminder: Invoice ${invoice.invoiceNumber}`;
    const html = `
      <p>Dear ${invoice.buyerName || "Buyer"},</p>
      <p>Payment for invoice <strong>${invoice.invoiceNumber}</strong> is delayed.</p>
      <p>Delivery date: ${new Date(invoice.deliveryDate).toDateString()}</p>
      <p>Total amount: ${invoice.currency || "INR"} ${Number(invoice.totalAmount || 0).toFixed(2)}</p>
      <p>Please process the payment at the earliest.</p>
      <p>Regards,<br/>${invoice.sellerName || "Supplier"}</p>
    `;

    try {
      await enqueueEmail(invoice.buyerEmail, subject, html);
    } catch (error) {
      await sendEmail({ to: invoice.buyerEmail, subject, html });
      log.warn({ requestId: data.requestId, companyId: data.companyId, error }, "Email queue unavailable, sent email directly");
    }

    await Notification.create({
      userId: String(invoice.buyerId || ""),
      companyId: data.companyId,
      type: "reminder_sent",
      priority: "medium",
      title: "Payment reminder sent",
      body: `Reminder sent for invoice ${invoice.invoiceNumber}`,
      entityType: "Invoice",
      entityId: String(invoice._id),
      actionUrl: `/buyer/ap-hub?invoiceId=${String(invoice._id)}`,
      metadata: { invoiceNumber: invoice.invoiceNumber },
    });
  }

  const now = new Date();
  invoice.reminderPolicy.lastReminderSentAt = now;
  invoice.reminderPolicy.remindersSentCount = Number(invoice.reminderPolicy.remindersSentCount || 0) + 1;
  invoice.reminderPolicy.nextReminderAt = computeNextReminderAt(now, invoice.reminderPolicy.intervalDays || 2);
  await invoice.save();

  return {
    skipped: false,
    invoiceId: String(invoice._id),
    invoiceNumber: invoice.invoiceNumber,
    reminderCount: Number(invoice.reminderPolicy.remindersSentCount || 0),
  };
}

const worker = new Worker(
  "q.reminders",
  async (job) => {
    const parsed = ReminderJobSchema.parse(job.data);
    log.info({ requestId: parsed.requestId, companyId: parsed.companyId, jobId: String(job.id) }, "Reminder job started");

    const result = await processReminderJob(parsed);

    log.info({ requestId: parsed.requestId, companyId: parsed.companyId, jobId: String(job.id), result }, "Reminder job completed");
    return result;
  },
  {
    connection: bullConnection,
    concurrency: Number(process.env.WORKER_CONCURRENCY_REMINDERS || 10),
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
    "Reminder job failed",
  );
});

worker.on("ready", () => {
  log.info({ requestId: "system", companyId: "system" }, "Reminder worker ready");
});

process.on("SIGTERM", async () => {
  await worker.close();
  await reminderQueue.close();
  await emailQueue.close();
  process.exit(0);
});
