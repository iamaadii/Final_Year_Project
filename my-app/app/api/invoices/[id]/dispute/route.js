import { z } from "zod";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { requireAuth, parseBody, successResponse, errorResponse, createNotification, writeAudit } from "@/lib/api/routeUtils";

const DisputeSchema = z.object({
  reason: z.string().min(1),
});

const ResolveSchema = z.object({
  resolution: z.string().optional(),
  newStatus: z.enum(["Approved", "Paid", "Settled"]).optional(),
});

export async function POST(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const parsed = await parseBody(req, DisputeSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) {
    return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  }

  const isSeller = String(invoice.sellerId) === String(user._id);
  const isBuyer = String(invoice.buyerId) === String(user._id);
  if (!isSeller && !isBuyer) {
    return errorResponse("FORBIDDEN", "Forbidden", 403, auth.requestId);
  }

  if (["Settled", "Paid", "paid"].includes(invoice.status)) {
    return errorResponse("VALIDATION_ERROR", "Cannot dispute a settled invoice", 400, auth.requestId);
  }

  try {
    const { reason } = parsed.data;

    invoice.status = "Disputed";
    invoice.disputeReason = String(reason).trim();
    invoice.disputeRaisedAt = new Date();
    invoice.auditTrail.push({
      action: "dispute_raised",
      userId: user._id,
      userName: user.name || user.email,
      timestamp: new Date(),
      details: `Dispute raised by ${user.userType}: ${String(reason).trim()}`,
    });

    await invoice.save();
    const notifyUserId = isSeller ? invoice.buyerId : invoice.sellerId;
    await createNotification({
      userId: notifyUserId,
      companyId: invoice.companyId,
      type: "dispute_raised",
      priority: "high",
      title: "Invoice dispute raised",
      body: `Invoice ${invoice.invoiceNumber} has a new dispute.`,
      entityType: "invoice",
      entityId: invoice._id.toString(),
      actionUrl: isSeller ? `/buyer/ap-hub?invoice=${invoice._id}` : `/seller/invoices?id=${invoice._id}`,
    });

    await writeAudit({
      user,
      companyId: invoice.companyId,
      action: "invoice_dispute_raised",
      resource: "Invoice",
      resourceId: invoice._id,
      details: { reason },
      req,
    });

    return successResponse({ invoice }, 200, auth.requestId);
  } catch {
    return errorResponse("SERVER_ERROR", "Server error", 500, auth.requestId);
  }
}

export async function PATCH(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  // Only buyers can resolve disputes (they approve payment)
  if (user.userType !== "Buyer") {
    return errorResponse("FORBIDDEN", "Only buyers can resolve disputes", 403, auth.requestId);
  }

  const parsed = await parseBody(req, ResolveSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) {
    return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  }

  if (String(invoice.buyerId) !== String(user._id)) {
    return errorResponse("FORBIDDEN", "Forbidden", 403, auth.requestId);
  }

  try {
    const { resolution, newStatus = "Approved" } = parsed.data;

    invoice.status = newStatus === "Settled" ? "Paid" : newStatus;
    invoice.auditTrail.push({
      action: "dispute_resolved",
      userId: user._id,
      userName: user.name || user.email,
      timestamp: new Date(),
      details: `Dispute resolved. ${resolution ? "Notes: " + String(resolution).trim() : ""}`,
    });

    await invoice.save();
    await createNotification({
      userId: invoice.sellerId,
      companyId: invoice.companyId,
      type: "dispute_resolved",
      priority: "medium",
      title: "Invoice dispute resolved",
      body: `Dispute resolved for invoice ${invoice.invoiceNumber}.`,
      entityType: "invoice",
      entityId: invoice._id.toString(),
      actionUrl: `/seller/invoices?id=${invoice._id}`,
    });

    await writeAudit({
      user,
      companyId: invoice.companyId,
      action: "invoice_dispute_resolved",
      resource: "Invoice",
      resourceId: invoice._id,
      details: { resolution: resolution || null, status: invoice.status },
      req,
    });

    return successResponse({ invoice }, 200, auth.requestId);
  } catch {
    return errorResponse("SERVER_ERROR", "Server error", 500, auth.requestId);
  }
}
