import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { requireAuth, successResponse, errorResponse, parseBody } from "@/lib/api/routeUtils";
import { z } from "zod";

const UpdateInvoiceSchema = z.object({
  status: z.string().optional(),
  isDeleted: z.boolean().optional(),
});

export async function GET(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    await dbConnect();
    const invoice = await Invoice.findById(id).lean();
    if (!invoice) return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);

    // Permission check: Must be seller, buyer, or part of the same company
    const isAdmin = ["super_admin", "company_admin"].includes(auth.user.role);
    const isOwner = String(invoice.sellerId) === auth.user._id || String(invoice.buyerId) === auth.user._id;
    const sameCompany = String(invoice.companyId) === auth.companyId;

    if (!isOwner && !sameCompany && !isAdmin) {
      return errorResponse("FORBIDDEN", "Unauthorized access", 403, auth.requestId);
    }

    const tempInv = new Invoice(invoice);
    const decrypted = { ...invoice, ...tempInv.getDecryptedGst() };
    return successResponse({ invoice: decrypted }, 200, auth.requestId);
  } catch (err) {
    return errorResponse("SERVER_ERROR", err.message, 500, auth.requestId);
  }
}

export async function PATCH(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const parsed = await parseBody(req, UpdateInvoiceSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  try {
    await dbConnect();
    const invoice = await Invoice.findById(id);
    if (!invoice) return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);

    const isAdmin = ["super_admin", "company_admin"].includes(auth.user.role);
    const isOwner = String(invoice.sellerId) === auth.user._id || String(invoice.buyerId) === auth.user._id;

    if (!isOwner && !isAdmin) {
      return errorResponse("FORBIDDEN", "Unauthorized update", 403, auth.requestId);
    }

    const update = parsed.data;
    Object.assign(invoice, update);
    await invoice.save();

    return successResponse({ invoice }, 200, auth.requestId);
  } catch (err) {
    return errorResponse("SERVER_ERROR", err.message, 500, auth.requestId);
  }
}

/**
 * DELETE [id]: Soft Delete an invoice.
 * Legal compliance (GST & DPDP Act 2023) requires keeping records for 6-8 years.
 * Hence, we only perform a soft-delete (archive) instead of permanent removal.
 */
export async function DELETE(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    await dbConnect();
    const invoice = await Invoice.findById(id);
    if (!invoice) return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);

    // Strict RBAC: Only Admin or Owner can delete
    const isAdmin = ["super_admin", "company_admin"].includes(auth.user.role);
    const isSeller = String(invoice.sellerId) === auth.user._id;

    if (!isAdmin && !isSeller) {
      return errorResponse("FORBIDDEN", "Insufficient permissions to delete this invoice", 403, auth.requestId);
    }

    // SOFT DELETE: Archiving record for legal data retention
    invoice.isDeleted = true;
    await invoice.save();

    return successResponse({ message: "Invoice archived successfully", id }, 200, auth.requestId);
  } catch (err) {
    return errorResponse("SERVER_ERROR", err.message, 500, auth.requestId);
  }
}
