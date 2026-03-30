import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { requireAuth, successResponse, errorResponse, ensureCompanyAccess } from "@/lib/api/routeUtils";
import { suggestGLCode } from "@/lib/aiGlSuggest";

export async function POST(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = params;
  await dbConnect();

  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) {
    return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  }

  if (!ensureCompanyAccess(invoice.companyId, auth.companyId)) {
    return errorResponse("FORBIDDEN", "Invoice does not belong to your company", 403, auth.requestId);
  }

  const suggestion = await suggestGLCode(invoice, auth.companyId);
  if (!suggestion) {
    return errorResponse("NO_SUGGESTION", "Unable to determine GL code suggestion", 404, auth.requestId);
  }

  return successResponse({ glCode: suggestion.accountCode, confidence: suggestion.confidence }, 200, auth.requestId);
}
