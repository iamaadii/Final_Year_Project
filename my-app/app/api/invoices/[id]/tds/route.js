import { z } from "zod";
import Invoice from "@/models/Invoice";
import { createJournalEntry } from "@/lib/accounting/journal";
import {
  requireAuth,
  parseBody,
  successResponse,
  errorResponse,
  writeAudit,
  ensureCompanyAccess,
} from "@/lib/api/routeUtils";

const TDSSchema = z.object({
  tdsSection: z.string(),
  tdsRate: z.number().min(0).max(100),
  tdsAmount: z.number().min(0),
});

export async function PATCH(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(req, TDSSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  if (!ensureCompanyAccess(invoice.companyId, auth.companyId)) return errorResponse("FORBIDDEN", "Forbidden", 403, auth.requestId);

  invoice.tdsSection = parsed.data.tdsSection;
  invoice.tdsRate = parsed.data.tdsRate;
  invoice.tdsAmount = parsed.data.tdsAmount;
  await invoice.save();

  await createJournalEntry({
    companyId: auth.companyId,
    entryDate: new Date(),
    referenceType: "tds",
    referenceId: invoice._id.toString(),
    narration: `TDS recorded for invoice ${invoice.invoiceNumber}`,
    lines: [
      { accountCode: "2300", accountName: "TDS Payable", debitAmount: parsed.data.tdsAmount, creditAmount: 0 },
      { accountCode: "1100", accountName: "Cash and Bank", debitAmount: 0, creditAmount: parsed.data.tdsAmount },
    ],
    createdBy: auth.user._id,
    createdByName: auth.user.name || auth.user.email,
  });

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "invoice_tds_updated",
    resource: "Invoice",
    resourceId: invoice._id,
    details: parsed.data,
    req,
  });

  return successResponse(invoice, 200, auth.requestId);
}
