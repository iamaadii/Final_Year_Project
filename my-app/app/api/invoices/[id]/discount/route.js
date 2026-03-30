import { z } from "zod";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import TreasuryConfig from "@/models/TreasuryConfig";
import { requireAuth, parseBody, successResponse, errorResponse, ensureCompanyAccess } from "@/lib/api/routeUtils";

const OfferSchema = z.object({
  discountRate: z.number().min(0.01).max(10),
});

const RespondSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

// POST: Buyer creates a discount offer on an approved invoice
export async function POST(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  if (user.userType !== "Buyer") {
    return errorResponse("FORBIDDEN", "Only buyers can offer early payments", 403, auth.requestId);
  }

  const parsed = await parseBody(req, OfferSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  await dbConnect();
  const companyId = String(auth.companyId || "");
  const treasuryConfig = await TreasuryConfig.findOne({ companyId }).lean();
  if (treasuryConfig?.paused) {
    return errorResponse("TREASURY_PAUSED", "Treasury programs are paused", 409, auth.requestId);
  }

  const { id } = await params;
  const { discountRate } = parsed.data;

  const invoice = await Invoice.findById(id);
  if (!invoice) return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  if (!ensureCompanyAccess(invoice.companyId, auth.companyId)) {
    return errorResponse("FORBIDDEN", "Invoice does not belong to your company", 403, auth.requestId);
  }
  if (String(invoice.buyerId) !== String(user._id)) {
    return errorResponse("FORBIDDEN", "Only the buyer on this invoice can offer discounts", 403, auth.requestId);
  }
  if (invoice.status !== "Approved") {
    return errorResponse("VALIDATION_ERROR", "Can only offer discounts on approved invoices", 400, auth.requestId);
  }

  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  const daysAccelerated = Math.max(0, Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)));
  const discountAmount = Math.round(invoice.totalAmount * (discountRate / 100) * 100) / 100;
  const earlyPaymentAmount = Math.round((invoice.totalAmount - discountAmount) * 100) / 100;

  invoice.discountOffer = {
    offeredAt: now,
    discountAmount,
    discountRate,
    daysAccelerated,
    status: "offered",
    earlyPaymentAmount,
  };

  invoice.auditTrail.push({
    action: "discount_offered",
    userId: user._id,
    userName: user.name,
    details: `Offered ${discountRate}% discount (INR ${discountAmount}) for ${daysAccelerated} days early payment`,
  });

  await invoice.save();

  return successResponse({
    discountOffer: invoice.discountOffer,
    annualizedYield: daysAccelerated > 0
      ? Math.round((discountRate / 100) * (365 / daysAccelerated) * 10000) / 100 + "%"
      : "N/A",
  }, 200, auth.requestId);
}

// PATCH: Seller accepts/declines the discount offer
export async function PATCH(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  if (user.userType !== "Seller") {
    return errorResponse("FORBIDDEN", "Only sellers can respond to discount offers", 403, auth.requestId);
  }

  const parsed = await parseBody(req, RespondSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  await dbConnect();
  const companyId = String(auth.companyId || "");
  const treasuryConfig = await TreasuryConfig.findOne({ companyId }).lean();
  if (treasuryConfig?.paused) {
    return errorResponse("TREASURY_PAUSED", "Treasury programs are paused", 409, auth.requestId);
  }

  const { id } = await params;
  const { action } = parsed.data; // "accept" | "decline"

  const invoice = await Invoice.findById(id);
  if (!invoice) return errorResponse("NOT_FOUND", "Invoice not found", 404, auth.requestId);
  if (!ensureCompanyAccess(invoice.companyId, auth.companyId)) {
    return errorResponse("FORBIDDEN", "Invoice does not belong to your company", 403, auth.requestId);
  }
  if (String(invoice.sellerId) !== String(user._id)) {
    return errorResponse("FORBIDDEN", "Only the seller on this invoice can respond", 403, auth.requestId);
  }
  if (invoice.discountOffer?.status !== "offered") {
    return errorResponse("VALIDATION_ERROR", "No active discount offer to respond to", 400, auth.requestId);
  }

  if (action === "accept") {
    invoice.discountOffer.status = "accepted";
    invoice.discountOffer.acceptedAt = new Date();
    invoice.auditTrail.push({
      action: "discount_accepted",
      userId: user._id,
      userName: user.name,
      details: `Accepted discount of INR ${invoice.discountOffer.discountAmount} for early payment of INR ${invoice.discountOffer.earlyPaymentAmount}`,
    });
  } else {
    invoice.discountOffer.status = "declined";
    invoice.auditTrail.push({
      action: "discount_declined",
      userId: user._id,
      userName: user.name,
      details: "Declined the early payment discount offer",
    });
  }

  await invoice.save();
  return successResponse({ discountOffer: invoice.discountOffer }, 200, auth.requestId);
}
