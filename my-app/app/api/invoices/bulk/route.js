import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { getUserFromToken } from "@/lib/apiAuth";

/**
 * POST /api/invoices/bulk
 * Body: { ids: string[], action: "approve" | "reject" | "mark-paid" }
 * Buyer-only. Processes up to 100 invoices per request.
 */
export async function POST(req) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.userType !== "Buyer") {
    return NextResponse.json({ message: "Only buyers can perform bulk actions" }, { status: 403 });
  }

  try {
    const { ids, action } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "ids must be a non-empty array" }, { status: 400 });
    }
    if (ids.length > 100) {
      return NextResponse.json({ message: "Maximum 100 invoices per bulk operation" }, { status: 400 });
    }

    const validActions = ["approve", "reject", "mark-paid"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ message: `action must be one of: ${validActions.join(", ")}` }, { status: 400 });
    }

    await dbConnect();

    const invoices = await Invoice.find({
      _id: { $in: ids },
      buyerId: user._id,
      isDeleted: false,
    });

    if (invoices.length === 0) {
      return NextResponse.json({ message: "No matching invoices found" }, { status: 404 });
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
          userId: user._id,
          userName: user.name || user.email,
          timestamp: now,
          details: `Bulk action: ${action}`,
        });
        await invoice.save();
        results.success.push(String(invoice._id));
      } catch {
        results.failed.push(String(invoice._id));
      }
    }

    return NextResponse.json({
      message: `Bulk ${action} completed`,
      processed: results.success.length,
      failed: results.failed.length,
      results,
    }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
