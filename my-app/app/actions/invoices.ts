"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import Invoice from "@/models/Invoice";
import { addDays, normalizeDate } from "@/lib/invoiceReminders";
import { sendEmail } from "@/lib/email";
import { getAuthUserFromCookies } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function toPositiveNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

type SanitizedLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export async function createInvoiceAction(formData: FormData) {
  try {
    const user = await getAuthUserFromCookies();
    if (!user || user.userType !== "Seller") {
      return { success: false, error: "Unauthorized or invalid user role" };
    }

    await dbConnect();

    const companyId = user.effectiveCompanyId || user._id; // Fallback for isolated users

    const invoiceNumber = formData.get("invoiceNumber");
    const buyerId = formData.get("buyerId");
    const buyerEmail = formData.get("buyerEmail");
    const issueDate = formData.get("issueDate");
    const deliveryDate = formData.get("deliveryDate");
    const dueDate = formData.get("dueDate");
    const currency = formData.get("currency") || "INR";
    const subtotalAmount = formData.get("subtotalAmount");
    const taxAmount = formData.get("taxAmount");
    const totalAmount = formData.get("totalAmount");
    const paymentTermsDays = formData.get("paymentTermsDays") || 45;
    const notes = formData.get("notes") || "";
    const sendApprovalRequest = formData.get("sendApprovalRequest") === "true";

    if (!invoiceNumber || !String(invoiceNumber).trim()) {
      return { success: false, error: "invoiceNumber is required" };
    }

    let buyer = null;
    if (buyerId) {
      buyer = await User.findById(buyerId);
    } else if (buyerEmail && String(buyerEmail).trim()) {
      buyer = await User.findOne({
        email: String(buyerEmail).trim().toLowerCase(),
        userType: "Buyer",
      });
    }

    if (!buyer || buyer.userType !== "Buyer") {
      return { success: false, error: "Valid buyer is required" };
    }

    const issue = normalizeDate(issueDate);
    const delivery = normalizeDate(deliveryDate);
    if (!issue || !delivery) {
      return { success: false, error: "Valid issueDate and deliveryDate are required" };
    }

    const termsDays = Number(paymentTermsDays) > 0 ? Number(paymentTermsDays) : 45;
    const resolvedDueDate = normalizeDate(dueDate) || addDays(delivery, termsDays);
    const resolvedSubtotal = toPositiveNumber(subtotalAmount, 0);
    const resolvedTax = toPositiveNumber(taxAmount, 0);
    const resolvedTotal = totalAmount !== undefined ? toPositiveNumber(totalAmount, 0) : resolvedSubtotal + resolvedTax;

    // We can extract line items if they were passed as JSON
    let sanitizedItems: SanitizedLineItem[] = [];
    const lineItemsRaw = formData.get("lineItems");
    if (typeof lineItemsRaw === "string" && lineItemsRaw) {
      try {
        const parsed = JSON.parse(lineItemsRaw);
        sanitizedItems = Array.isArray(parsed)
          ? parsed.map((item) => ({
              description: String(item?.description || "").trim(),
              quantity: toPositiveNumber(item?.quantity, 0),
              unitPrice: toPositiveNumber(item?.unitPrice, 0),
              total: item?.total !== undefined ? toPositiveNumber(item.total, 0) : toPositiveNumber(item?.quantity, 0) * toPositiveNumber(item?.unitPrice, 0),
            }))
          : [];
      } catch {
        // Ignored
      }
    }

    const created = await Invoice.create({
      invoiceNumber: String(invoiceNumber).trim(),
      sellerId: user._id,
      buyerId: buyer._id,
      companyId: companyId,
      sellerName: user.name || "",
      sellerEmail: user.email || "",
      buyerName: buyer.name || "",
      buyerEmail: buyer.email || "",
      issueDate: issue,
      deliveryDate: delivery,
      dueDate: resolvedDueDate,
      currency: String(currency).toUpperCase(),
      subtotalAmount: resolvedSubtotal,
      taxAmount: resolvedTax,
      totalAmount: resolvedTotal,
      paymentTermsDays: termsDays,
      status: "Pending Approval",
      notes: String(notes),
      lineItems: sanitizedItems,
      reminderPolicy: {
        enabled: true,
        startAfterDays: 45,
        intervalDays: 2,
        nextReminderAt: addDays(delivery, 45),
      },
    });

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
      } catch (e) {
        console.warn("Failed to send approval email", e);
      }
    }

    // Revalidate the seller dashboard to show the new invoice instantly
    revalidatePath("/seller/dashboard");
    revalidatePath("/api/accounting/summary"); // Also invalidate API paths caching

    // Return serializable id
    return { success: true, invoiceId: created._id.toString() };
  } catch (error) {
    const err = error as { code?: number } | null;
    if (err?.code === 11000) {
      return { success: false, error: "Invoice number already exists for this seller" };
    }
    return { success: false, error: "Internal Server Error" };
  }
}
