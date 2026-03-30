import { z } from "zod";
import Invoice from "@/models/Invoice";
import {
  requireAuth,
  parseBody,
  successResponse,
  errorResponse,
  writeAudit,
  createNotification,
  ensureCompanyAccess,
} from "@/lib/api/routeUtils";

const RejectSchema = z.object({
  reason: z.string().min(1),
});

export async function POST(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(req, RejectSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) {
    return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  }

  if (!ensureCompanyAccess(invoice.companyId, auth.companyId)) {
    return errorResponse("FORBIDDEN", "Invoice does not belong to your company", 403, auth.requestId);
  }

  invoice.approvalStatus = "rejected";
  invoice.status = "Disputed";
  invoice.approvalHistory.push({
    level: Number(invoice.approvalLevel || 1),
    action: "rejected",
    userId: String(auth.user._id),
    userName: auth.user.name || auth.user.email,
    notes: parsed.data.reason,
    timestamp: new Date(),
  });

  await invoice.save();

  await createNotification({
    userId: String(invoice.sellerId),
    companyId: auth.companyId,
    type: "approval_rejected",
    priority: "high",
    title: "Invoice rejected",
    body: `Invoice ${invoice.invoiceNumber} was rejected. Reason: ${parsed.data.reason}`,
    entityType: "invoice",
    entityId: invoice._id.toString(),
    actionUrl: `/seller/invoices?id=${invoice._id}`,
  });

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "invoice_rejected",
    resource: "Invoice",
    resourceId: invoice._id,
    details: {
      reason: parsed.data.reason,
      approvalLevel: invoice.approvalLevel,
    },
    req,
  });

  return successResponse(invoice, 200, auth.requestId);
}
