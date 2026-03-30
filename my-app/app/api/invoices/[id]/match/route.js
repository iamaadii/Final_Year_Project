import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import PurchaseOrder from "@/models/PurchaseOrder";
import GRN from "@/models/GRN";
import { runThreeWayMatch } from "@/lib/matchingEngine";
import { requireAuth, successResponse, errorResponse, ensureCompanyAccess } from "@/lib/api/routeUtils";
import { addJob, matchQueue } from "@/lib/workers/queue";

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

  const companyId = auth.companyId;
  const po = invoice.poId ? await PurchaseOrder.findOne({ _id: invoice.poId, companyId }).lean() : null;
  const grn = invoice.grnId ? await GRN.findOne({ _id: invoice.grnId, companyId }).lean() : null;

  if (!po || !grn) {
    return errorResponse("NOT_FOUND", "Linked PO or GRN not found or unauthorized", 404, auth.requestId);
  }

  const matchResults = runThreeWayMatch(invoice, po, grn);
  return successResponse({ matchResults }, 200, auth.requestId);
}

export async function POST(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  await dbConnect();

  const invoice = await Invoice.findById(id).lean();
  if (!invoice) return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  if (!ensureCompanyAccess(invoice.companyId, auth.companyId)) {
    return errorResponse("FORBIDDEN", "Invoice does not belong to your company", 403, auth.requestId);
  }

  const queuedJob = await addJob(
    matchQueue,
    {
      requestId: auth.requestId,
      companyId: auth.companyId,
      invoiceId: String(invoice._id),
    },
    {
      jobId: `match:${String(invoice._id)}:${new Date().toISOString().slice(0, 13)}`,
    },
    "run-match",
  );

  return successResponse({ jobId: queuedJob?.id || null }, 200, auth.requestId);
}
