import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { requireAuth, successResponse } from "@/lib/api/routeUtils";

function toISODate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function monthRange(monthParam) {
  if (!monthParam) {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  const [year, month] = String(monthParam).split("-").map(Number);
  if (!year || !month) return monthRange(null);
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 0, 23, 59, 59, 999),
  };
}

export async function GET(req) {
  await dbConnect();
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const companyId = req.nextUrl.searchParams.get("companyId") || auth.companyId;
  const month = req.nextUrl.searchParams.get("month");
  const { start, end } = monthRange(month);

  const dueInvoices = await Invoice.find({
    companyId,
    dueDate: { $gte: start, $lte: end },
    isDeleted: false,
    status: { $nin: ["Paid", "Cancelled", "paid", "cancelled"] },
  })
    .select("_id invoiceNumber dueDate totalAmount sellerName status")
    .sort({ dueDate: 1 })
    .lean();

  const invoiceItems = dueInvoices.map((inv) => ({
    type: "invoice_due",
    date: toISODate(inv.dueDate),
    title: `Invoice ${inv.invoiceNumber || inv._id} due`,
    severity: "medium",
    entityType: "Invoice",
    entityId: String(inv._id),
    payload: {
      totalAmount: Number(inv.totalAmount || 0),
      vendorName: inv.sellerName || "",
      status: inv.status,
    },
  }));

  const statutoryItems = [
    {
      type: "gst_gstr1",
      date: toISODate(new Date(start.getFullYear(), start.getMonth() + 1, 11)),
      title: "GSTR-1 filing due",
      severity: "high",
      entityType: "Compliance",
      entityId: "gstr1",
      payload: { frequency: "monthly" },
    },
    {
      type: "gst_gstr3b",
      date: toISODate(new Date(start.getFullYear(), start.getMonth() + 1, 20)),
      title: "GSTR-3B filing due",
      severity: "critical",
      entityType: "Compliance",
      entityId: "gstr3b",
      payload: { frequency: "monthly" },
    },
    {
      type: "tds_return_26q",
      date: toISODate(new Date(start.getFullYear(), start.getMonth() + 1, 7)),
      title: "TDS return/payment due",
      severity: "high",
      entityType: "Compliance",
      entityId: "tds",
      payload: { section: "26Q" },
    },
  ];

  const items = [...invoiceItems, ...statutoryItems].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return successResponse({ month: month || start.toISOString().slice(0, 7), items }, 200, auth.requestId);
}
