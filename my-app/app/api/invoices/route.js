import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Invoice from "@/models/Invoice";
import CounterpartyLink from "@/models/CounterpartyLink";
import { addDays, normalizeDate } from "@/lib/invoiceReminders";
import { sendEmail } from "@/lib/email";
import { requireAuth, parseBody, successResponse, errorResponse } from "@/lib/api/routeUtils";

function toPositiveNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const InvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  buyerId: z.string().optional(),
  buyerEmail: z.string().optional(),
  buyerName: z.string().optional(),
  businessName: z.string().optional(),
  gstin: z.string().optional(),
  issueDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  dueDate: z.string().optional(),
  currency: z.string().optional(),
  subtotalAmount: z.number().optional(),
  taxAmount: z.number().optional(),
  totalAmount: z.number().optional(),
  paymentTermsDays: z.number().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.any()).optional(),
  reminderPolicy: z.any().optional(),
  sendApprovalRequest: z.boolean().optional(),
});

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  
  try {
    await dbConnect();
    const companyId = auth.companyId;
    
    if (!companyId) return errorResponse("FORBIDDEN", "Company ID missing", 403, auth.requestId);

    // Connection-based data isolation:
    // Only fetch invoices where an active connection exists for the current user's role
    const [connectedIds, teamIds] = await Promise.all([
      CounterpartyLink.find({
        $or: [
          { inviterCompanyId: auth.companyId, status: "active" },
          { inviteeId: auth.user._id, status: "active" },
          { inviteeCompanyId: auth.companyId, status: "active" }
        ]
      }).lean().then(links => links.map(c => 
        String(c.inviterId) === auth.user._id ? c.inviteeId : c.inviterId
      ).filter(Boolean)),
      User.find({ 
        $or: [
          { companyId: auth.companyId },
          { effectiveCompanyId: auth.companyId }
        ] 
      }).select("_id").lean().then(users => users.map(u => u._id))
    ]);

    const query = { 
      isDeleted: false,
      $or: [
        { buyerCompanyId: auth.companyId },
        { sellerCompanyId: auth.companyId },
        { companyId: auth.companyId },
        { sellerId: { $in: teamIds } },
        { buyerId: { $in: teamIds } },
        { sellerId: { $in: connectedIds } },
        { buyerId: { $in: connectedIds } }
      ]
    };
    
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const buyerId = url.searchParams.get("buyerId");
    const sellerId = url.searchParams.get("sellerId");

    if (status) query.status = status;
    if (buyerId) query.buyerId = buyerId;
    if (sellerId) query.sellerId = sellerId;

    const invoices = await Invoice.find(query).sort({ createdAt: -1 }).lean();
    
    const decrypted = invoices.map(inv => {
      const tempInv = new Invoice(inv);
      return { ...inv, ...tempInv.getDecryptedGst() };
    });

    return successResponse({ invoices: decrypted }, 200, auth.requestId);
  } catch (error) {
    console.error(`[GET /api/invoices] Error:`, error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch invoices", 500, auth.requestId);
  }
}

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  if (user.userType !== "Seller") return errorResponse("FORBIDDEN", "Forbidden", 403, auth.requestId);

  const parsed = await parseBody(req, InvoiceSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  try {
    const body = parsed.data;
    const companyId = auth.companyId;
    if (!companyId) return errorResponse("FORBIDDEN", "Company ID missing", 403, auth.requestId);

    const {
      invoiceNumber,
      buyerId,
      buyerEmail,
      buyerName,
      businessName,
      gstin,
      issueDate,
      deliveryDate,
      dueDate,
      currency = "INR",
      subtotalAmount,
      taxAmount,
      totalAmount,
      paymentTermsDays = 45,
      status = "Pending Approval",
      notes = "",
      lineItems = [],
      reminderPolicy = {},
      sendApprovalRequest = false,
    } = body || {};

    if (!invoiceNumber || !String(invoiceNumber).trim()) {
      return errorResponse("VALIDATION_ERROR", "invoiceNumber is required", 400, auth.requestId);
    }
    let buyer = null;
    if (buyerId) {
      buyer = await User.findById(buyerId);
    } else if (buyerEmail && String(buyerEmail).trim()) {
      buyer = await User.findOne({
        email: String(buyerEmail).trim().toLowerCase(),
        userType: "Buyer",
      });
    } else if (gstin && String(gstin).trim()) {
      // Lookup by GSTIN (Exact match for plain text or fallback logic)
      const targetGstin = String(gstin).trim().toUpperCase();
      buyer = await User.findOne({
        $or: [{ gstNumber: targetGstin }, { gstNumber: targetGstin.slice(2, 12) }],
        userType: "Buyer",
      });
    } else if ((buyerName || businessName) && String(buyerName || businessName).trim()) {
      // Lookup by Company Name (Primary identifier for Buyer entity)
      const targetName = String(buyerName || businessName).trim();
      buyer = await User.findOne({
        $or: [
          { companyName: new RegExp(`^${targetName}$`, "i") },
          { name: new RegExp(`^${targetName}$`, "i") }
        ],
        userType: "Buyer",
      });
    }
    
    if (!buyer || buyer.userType !== "Buyer") {
      return errorResponse("VALIDATION_ERROR", "A valid buyer must be specified (Email, Business Name, or GSTIN)", 400, auth.requestId);
    }

    // Verify active connection between Seller and Buyer
    const activeConnection = await CounterpartyLink.findOne({
      $or: [
        { inviterCompanyId: auth.companyId, inviteeId: buyer._id, status: "active" },
        { inviterId: buyer._id, inviteeId: auth.user._id, status: "active" }
      ]
    });

    if (!activeConnection) {
      return errorResponse("FORBIDDEN", `Business Connection not established or pending. Please invite "${buyer.companyName || buyer.name}" to connect first.`, 403, auth.requestId);
    }

    // Duplicate Check: Same invoice number within the same company
    const existing = await Invoice.findOne({ 
      companyId, 
      invoiceNumber: String(invoiceNumber).trim(),
      isDeleted: false 
    });
    
    if (existing) {
      return errorResponse("CONFLICT", `Invoice ${invoiceNumber} already exists in the registry`, 409, auth.requestId);
    }

    const issue = normalizeDate(issueDate);
    const delivery = normalizeDate(deliveryDate);
    if (!issue || !delivery) {
      return errorResponse("VALIDATION_ERROR", "Valid issueDate and deliveryDate are required", 400, auth.requestId);
    }

    const termsDays = Number(paymentTermsDays) > 0 ? Number(paymentTermsDays) : 45;
    const resolvedDueDate = normalizeDate(dueDate) || addDays(delivery, termsDays);
    const resolvedSubtotal = toPositiveNumber(subtotalAmount, 0);
    const resolvedTax = toPositiveNumber(taxAmount, 0);
    const resolvedTotal =
      totalAmount !== undefined ? toPositiveNumber(totalAmount, 0) : resolvedSubtotal + resolvedTax;

    const sanitizedItems = Array.isArray(lineItems)
      ? lineItems.map((item) => ({
          description: String(item?.description || "").trim(),
          quantity: toPositiveNumber(item?.quantity, 0),
          unitPrice: toPositiveNumber(item?.unitPrice, 0),
          total:
            item?.total !== undefined
              ? toPositiveNumber(item.total, 0)
              : toPositiveNumber(item?.quantity, 0) * toPositiveNumber(item?.unitPrice, 0),
        }))
      : [];

    const created = await Invoice.create({
      invoiceNumber: String(invoiceNumber).trim(),
      sellerId: user._id,
      buyerId: buyer._id,
      buyerCompanyId: buyer.companyId || buyer.effectiveCompanyId,
      sellerCompanyId: user.companyId || user.effectiveCompanyId,
      companyId: user.effectiveCompanyId || user.companyId, // Ownership link
      sellerName: user.companyName || user.name || "",
      sellerEmail: user.email || "",
      buyerName: buyer.companyName || buyer.name || "",
      buyerEmail: buyer.email || "",
      issueDate: issue,
      deliveryDate: delivery,
      dueDate: resolvedDueDate,
      currency: String(currency || "INR").toUpperCase(),
      subtotalAmount: resolvedSubtotal,
      taxAmount: resolvedTax,
      totalAmount: resolvedTotal,
      paymentTermsDays: termsDays,
      status,
      notes: String(notes || ""),
      lineItems: sanitizedItems,
      reminderPolicy: {
        enabled: reminderPolicy?.enabled !== false,
        startAfterDays: Number(reminderPolicy?.startAfterDays || 45),
        intervalDays: Number(reminderPolicy?.intervalDays || 2),
        nextReminderAt: addDays(delivery, Number(reminderPolicy?.startAfterDays || 45)),
      },
    });

    let approvalRequestSent = false;
    let approvalRequestError = "";
    if (sendApprovalRequest) {
      try {
        await sendEmail({
          to: buyer.email,
          subject: `Approval requested for invoice ${created.invoiceNumber}`,
          html: `
            <p>Dear ${buyer.name},</p>
            <p>You have a new invoice approval request from <strong>${user.name}</strong>.</p>
            <p><strong>Invoice:</strong> ${created.invoiceNumber}</p>
            <p><strong>Total:</strong> ${created.currency} ${created.totalAmount.toFixed(2)}</p>
            <p>Please review and approve the invoice in the buyer portal.</p>
          `,
        });
        approvalRequestSent = true;
      } catch (e) {
        approvalRequestError = e?.message || "Unable to send approval request email";
      }
    }

    return successResponse(
      {
        invoice: created,
        approvalRequestSent,
        approvalRequestError,
      },
      201,
      auth.requestId,
    );
  } catch (error) {
    const dup = error?.code === 11000;
    return errorResponse(
      dup ? "DUPLICATE" : "SERVER_ERROR",
      dup ? "Invoice number already exists for this seller" : "Server error",
      dup ? 409 : 500,
      auth.requestId,
    );
  }
}
