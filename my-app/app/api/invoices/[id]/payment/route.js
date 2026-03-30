import { z } from "zod";
import Invoice from "@/models/Invoice";
import TreasuryConfig from "@/models/TreasuryConfig";
import { createJournalEntry } from "@/lib/accounting/journal";
import {
  requireAuth,
  parseBody,
  successResponse,
  errorResponse,
  writeAudit,
  createNotification,
  ensureCompanyAccess,
} from "@/lib/api/routeUtils";

const PaymentSchema = z.object({
  amount: z.number().positive(),
  paymentDate: z.string().datetime(),
  paymentMode: z.enum(["upi", "neft", "rtgs", "cheque", "manual"]),
  utr: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const treasuryConfig = await TreasuryConfig.findOne({ companyId: auth.companyId }).lean();
  if (treasuryConfig?.paused) {
    return errorResponse("TREASURY_PAUSED", "Treasury programs are paused", 409, auth.requestId);
  }

  const parsed = await parseBody(req, PaymentSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  const invoice = await Invoice.findById(id);

  if (!invoice || invoice.isDeleted) {
    return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  }

  if (!ensureCompanyAccess(invoice.companyId, auth.companyId)) {
    return errorResponse("FORBIDDEN", "Invoice does not belong to your company", 403, auth.requestId);
  }

  const totalAmount = Number(invoice.totalAmount || 0);
  const paidAmount = Math.min(totalAmount, Math.max(0, Number(invoice.amountPaid || 0)));
  const remaining = Math.max(0, totalAmount - paidAmount);

  if (remaining <= 0) {
    return errorResponse("INVALID_PAYMENT", "Invoice is already fully settled", 400, auth.requestId);
  }

  if (parsed.data.amount > remaining) {
    return errorResponse("INVALID_PAYMENT", "Payment amount exceeds pending invoice amount", 400, auth.requestId);
  }

  const nextPaidAmount = Math.min(totalAmount, Math.round((paidAmount + parsed.data.amount) * 100) / 100);
  const fullySettled = nextPaidAmount >= totalAmount - 0.01;

  invoice.amountPaid = nextPaidAmount;
  invoice.status = fullySettled ? "Paid" : "Partially Settled";
  invoice.paymentReceivedAt = fullySettled ? new Date(parsed.data.paymentDate) : null;
  invoice.paymentUTR = parsed.data.utr || null;
  invoice.paymentMode = parsed.data.paymentMode;
  invoice.notes = parsed.data.notes ? `${invoice.notes || ""}\n${parsed.data.notes}`.trim() : invoice.notes;

  await invoice.save();

  await createJournalEntry({
    companyId: auth.companyId,
    entryDate: new Date(parsed.data.paymentDate),
    referenceType: "payment",
    referenceId: invoice._id.toString(),
    narration: `Payment recorded for invoice ${invoice.invoiceNumber}`,
    lines: [
      { accountCode: "2100", accountName: "Accounts Payable", debitAmount: parsed.data.amount, creditAmount: 0 },
      { accountCode: "1100", accountName: "Cash and Bank", debitAmount: 0, creditAmount: parsed.data.amount },
    ],
    createdBy: auth.user._id,
    createdByName: auth.user.name || auth.user.email,
  });

  await createNotification({
    userId: invoice.sellerId,
    companyId: auth.companyId,
    type: fullySettled ? "invoice_paid" : "invoice_partially_settled",
    priority: "medium",
    title: fullySettled ? "Invoice paid" : "Partial payment recorded",
    body: fullySettled
      ? `Invoice ${invoice.invoiceNumber} has been fully settled.`
      : `Partial payment recorded for invoice ${invoice.invoiceNumber}. Remaining: INR ${Math.max(0, totalAmount - nextPaidAmount).toLocaleString("en-IN")}`,
    entityType: "invoice",
    entityId: invoice._id.toString(),
    actionUrl: `/seller/invoices?id=${invoice._id}`,
  });

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "invoice_payment_recorded",
    resource: "Invoice",
    resourceId: invoice._id,
    details: {
      invoiceId: invoice._id,
      amount: parsed.data.amount,
      paymentMode: parsed.data.paymentMode,
      utr: parsed.data.utr || null,
    },
    req,
  });

  return successResponse(invoice, 200, auth.requestId);
}
