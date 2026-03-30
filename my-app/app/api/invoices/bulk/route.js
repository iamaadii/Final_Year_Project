import { z } from "zod";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { requireAuth, parseBody, successResponse, errorResponse, writeAudit } from "@/lib/api/routeUtils";

const BulkSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  action: z.enum(["approve", "reject", "mark-paid"]),
});

/**
 * POST /api/invoices/bulk
 * Body: { ids: string[], action: "approve" | "reject" | "mark-paid" }
 * Buyer-only. Processes up to 100 invoices per request.
 */
export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.user.userType !== "Buyer") {
    return errorResponse("FORBIDDEN", "Only buyers can perform bulk actions", 403, auth.requestId);
  }

  const parsed = await parseBody(req, BulkSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  try {
    const { ids, action } = parsed.data;

    await dbConnect();

    const invoices = await Invoice.find({
      _id: { $in: ids },
      buyerId: auth.user._id,
      isDeleted: false,
    });

    if (invoices.length === 0) {
      return errorResponse("NOT_FOUND", "No matching invoices found", 404, auth.requestId);
    }

    const actionMap = {
      "approve": "Approved",
      "reject": "Disputed",
      "mark-paid": "Settled",
    };
    const newStatus = actionMap[action];
    const now = new Date();
    const results = { success: [], failed: [] };

    for (const invoice of invoices) {
      try {
        invoice.status = newStatus;
        if (action === "mark-paid") {
          invoice.paymentReceivedAt = now;
          invoice.reminderPolicy.nextReminderAt = null;
        }
        invoice.auditTrail.push({
          action: `bulk_${action.replace("-", "_")}`,
          userId: auth.user._id,
          userName: auth.user.name || auth.user.email,
          timestamp: now,
          details: `Bulk action: ${action}`,
        });
        await invoice.save();
        results.success.push(String(invoice._id));
      } catch {
        results.failed.push(String(invoice._id));
      }
    }

    await writeAudit({
      user: auth.user,
      companyId: auth.companyId,
      action: "invoice_bulk_action",
      resource: "Invoice",
      resourceId: null,
      details: { action, processed: results.success.length, failed: results.failed.length },
      req,
    });

    return successResponse({
      processed: results.success.length,
      failed: results.failed.length,
      results,
    }, 200, auth.requestId);
  } catch {
    return errorResponse("SERVER_ERROR", "Server error", 500, auth.requestId);
  }
}
