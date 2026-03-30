import { z } from "zod";
import Invoice from "@/models/Invoice";
import User from "@/models/User";
import {
  requireAuth,
  parseBody,
  successResponse,
  errorResponse,
  writeAudit,
  createNotification,
  ensureCompanyAccess,
} from "@/lib/api/routeUtils";

const ApproveSchema = z.object({
  notes: z.string().optional(),
});

function resolveRequiredLevel(totalAmount, thresholds = []) {
  const sorted = [...thresholds].sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
  let required = 0;
  for (const threshold of sorted) {
    const max = threshold.maxAmount;
    if (max == null || Number(totalAmount) <= Number(max)) {
      required = Number(threshold.level || 0);
      break;
    }
    required = Number(threshold.level || 0);
  }
  return Math.max(required, 1);
}

export async function POST(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(req, ApproveSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) {
    return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  }

  if (!ensureCompanyAccess(invoice.companyId, auth.companyId)) {
    return errorResponse("FORBIDDEN", "Invoice does not belong to your company", 403, auth.requestId);
  }

  const companyUsers = await User.find({ companyId: auth.companyId, userType: "Buyer" }).select("approvalThresholds name email");
  const allThresholds = companyUsers.flatMap((u) => Array.isArray(u.approvalThresholds) ? u.approvalThresholds : []);

  if (!allThresholds.length) {
    invoice.approvalStatus = "approved";
    invoice.approvalLevel = 1;
    invoice.status = "Approved";
  } else {
    const requiredLevel = resolveRequiredLevel(invoice.totalAmount, allThresholds);
    const levelConfig = allThresholds.find((t) => Number(t.level || 0) === Number(invoice.approvalLevel || 1))
      || allThresholds.find((t) => Number(t.level || 0) === 1);

    const authorized = Array.isArray(levelConfig?.approverIds)
      && levelConfig.approverIds.map(String).includes(String(auth.user._id));

    if (!authorized) {
      return errorResponse("FORBIDDEN", "You are not authorized to approve at this level", 403, auth.requestId);
    }

    invoice.approvalHistory.push({
      level: Number(levelConfig?.level || 1),
      action: "approved",
      userId: String(auth.user._id),
      userName: auth.user.name || auth.user.email,
      notes: parsed.data.notes || "",
      timestamp: new Date(),
    });

    if (Number(levelConfig?.level || 1) >= requiredLevel) {
      invoice.approvalStatus = "approved";
      invoice.approvalLevel = requiredLevel;
      invoice.status = "Approved";
    } else {
      invoice.approvalStatus = "pending";
      invoice.approvalLevel = Number(levelConfig?.level || 1) + 1;

      const nextThreshold = allThresholds.find((t) => Number(t.level || 0) === invoice.approvalLevel);
      const nextApproverId = nextThreshold?.approverIds?.[0];
      if (nextApproverId) {
        await createNotification({
          userId: nextApproverId,
          companyId: auth.companyId,
          type: "approval_required",
          priority: "high",
          title: "Invoice approval required",
          body: `Invoice ${invoice.invoiceNumber} requires your approval at level ${invoice.approvalLevel}.`,
          entityType: "invoice",
          entityId: invoice._id.toString(),
          actionUrl: `/buyer/ap-hub?invoice=${invoice._id}`,
        });
      }
    }
  }

  await invoice.save();

  await createNotification({
    userId: String(invoice.sellerId),
    companyId: auth.companyId,
    type: "approval_done",
    priority: "medium",
    title: "Invoice approval updated",
    body: `Invoice ${invoice.invoiceNumber} approval status: ${invoice.approvalStatus}.`,
    entityType: "invoice",
    entityId: invoice._id.toString(),
    actionUrl: `/seller/invoices?id=${invoice._id}`,
  });

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "invoice_approved",
    resource: "Invoice",
    resourceId: invoice._id,
    details: {
      invoiceId: invoice._id,
      approvalStatus: invoice.approvalStatus,
      approvalLevel: invoice.approvalLevel,
    },
    req,
  });

  return successResponse(invoice, 200, auth.requestId);
}
