import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { sendEmail } from "@/lib/email";
import { computeNextReminderAt, shouldSendReminder } from "@/lib/invoiceReminders";

function isAuthorizedBySecret(req) {
  const configured = process.env.REMINDER_CRON_SECRET;
  if (!configured) return false;
  const provided = req.headers.get("x-reminder-secret");
  return !!provided && provided === configured;
}

export async function POST(req) {
  if (!isAuthorizedBySecret(req)) {
    return NextResponse.json(
      { message: "Unauthorized reminder runner. Provide x-reminder-secret." },
      { status: 401 },
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
  let sent = 0;
  let failed = 0;
  const failures = [];

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";

  for (const invoice of toNotify) {
    try {
      if (!dryRun) {
        await sendEmail({
          to: invoice.buyerEmail,
          subject: `Payment delay reminder: Invoice ${invoice.invoiceNumber}`,
          html: `
            <p>Dear ${invoice.buyerName},</p>
            <p>Payment for invoice <strong>${invoice.invoiceNumber}</strong> is delayed.</p>
            <p>Delivery date: ${new Date(invoice.deliveryDate).toDateString()}</p>
            <p>Total amount: ${invoice.currency} ${invoice.totalAmount.toFixed(2)}</p>
            <p>Please process the payment at the earliest.</p>
            <p>Regards,<br/>${invoice.sellerName}</p>
          `,
        });
      }

      invoice.reminderPolicy.lastReminderSentAt = now;
      invoice.reminderPolicy.remindersSentCount =
        Number(invoice.reminderPolicy.remindersSentCount || 0) + 1;
      invoice.reminderPolicy.nextReminderAt = computeNextReminderAt(
        now,
        invoice.reminderPolicy.intervalDays || 2,
      );
      await invoice.save();
      sent += 1;
    } catch (error) {
      failed += 1;
      failures.push({
        invoiceId: String(invoice._id),
        invoiceNumber: invoice.invoiceNumber,
        error: error?.message || "Unknown email failure",
      });
    }
  }

  return NextResponse.json(
    {
      checked: candidates.length,
      due: toNotify.length,
      sent,
      failed,
      dryRun,
      failures,
    },
    { status: 200 },
  );
}
