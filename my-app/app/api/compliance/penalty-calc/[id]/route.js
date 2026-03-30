import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { calculatePenalty, getOverdueDays, getMsmedDeadline } from "@/lib/complianceCalc";
import { requireAuth, successResponse, errorResponse, ensureCompanyAccess } from "@/lib/api/routeUtils";

export async function GET(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id).lean();
  if (!invoice) return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  if (!ensureCompanyAccess(invoice.companyId, auth.companyId)) {
    return errorResponse("FORBIDDEN", "Invoice does not belong to your company", 403, auth.requestId);
  }

  // Calculate MSMED deadline
  const deadline = invoice.msmedDeadline
    ? new Date(invoice.msmedDeadline)
    : getMsmedDeadline(invoice.issueDate, invoice.paymentTermsDays || 45);

  const overdueDays = getOverdueDays(deadline, invoice.paymentReceivedAt);

  const rbiRate = parseFloat(process.env.RBI_BANK_RATE || "0.065");
  const penalty = calculatePenalty(invoice.totalAmount, overdueDays, rbiRate);

  return successResponse({
    invoiceNumber: invoice.invoiceNumber,
    sellerName: invoice.sellerName,
    buyerName: invoice.buyerName,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    msmedDeadline: deadline,
    paymentTermsDays: invoice.paymentTermsDays,
    status: invoice.status,
    ...penalty,
  }, 200, auth.requestId);
}
