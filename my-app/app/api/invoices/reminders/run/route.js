import crypto from "crypto";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { shouldSendReminder } from "@/lib/invoiceReminders";
import { addJob, reminderQueue } from "@/lib/workers/queue";
import { successResponse, errorResponse } from "@/lib/api/routeUtils";

function isAuthorizedBySecret(req) {
  const configured = process.env.REMINDER_CRON_SECRET;
  if (!configured) return false;
  const provided = req.headers.get("x-reminder-secret");
  return !!provided && provided === configured;
}

export async function POST(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  if (!isAuthorizedBySecret(req)) {
    return errorResponse(
      "UNAUTHORIZED",
      "Unauthorized reminder runner. Provide x-reminder-secret.",
      401,
      requestId,
    );
  }

  await dbConnect();
  const now = new Date();
  const candidates = await Invoice.find({
    isDeleted: false,
    paymentReceivedAt: null,
    "reminderPolicy.enabled": true,
    status: { $ne: "Settled" },
  });

  const toNotify = candidates.filter((invoice) => shouldSendReminder(invoice, now));
  let queued = 0;
  let failed = 0;
  const failures = [];

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
  for (const invoice of toNotify) {
    try {
      await addJob(
        reminderQueue,
        {
          requestId,
          companyId: String(invoice.companyId),
          invoiceId: String(invoice._id),
          dryRun,
        },
        {
          jobId: `reminder:${String(invoice._id)}:${now.toISOString().slice(0, 13)}`,
        },
        "send-payment-reminder",
      );
      queued += 1;
    } catch (error) {
      failed += 1;
      failures.push({
        invoiceId: String(invoice._id),
        invoiceNumber: invoice.invoiceNumber,
        error: error?.message || "Unknown email failure",
      });
    }
  }

  return successResponse(
    {
      checked: candidates.length,
      due: toNotify.length,
      queued,
      failed,
      dryRun,
      failures,
    },
    200,
    requestId,
  );
}
