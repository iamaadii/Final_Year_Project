import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Invoice from "@/models/Invoice";
import { addDays, normalizeDate } from "@/lib/invoiceReminders";
import { sendEmail } from "@/lib/email";
import { getUserFromToken } from "@/lib/apiAuth";

function toPositiveNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const companyId = user.effectiveCompanyId;
  
  if (!companyId) return NextResponse.json({ message: "Company ID missing" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const buyerId = searchParams.get("buyerId");
  const sellerId = searchParams.get("sellerId");

  // Data Isolation Filter: Must match companyId
  const query = { 
    companyId, 
    isDeleted: false 
  };
  
  if (status) query.status = status;
  if (buyerId) query.buyerId = buyerId;
  if (sellerId) query.sellerId = sellerId;

  const invoices = await Invoice.find(query).sort({ createdAt: -1 }).lean();
  
  // Decrypt GSTINs for response
  const decrypted = invoices.map(inv => {
    const tempInv = new Invoice(inv);
    return { ...inv, ...tempInv.getDecryptedGst() };
  });

  return NextResponse.json({ invoices: decrypted }, { status: 200 });
}

export async function POST(req) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.userType !== "Seller") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const companyId = user.effectiveCompanyId;
    if (!companyId) return NextResponse.json({ message: "Company ID missing" }, { status: 403 });

    const {
      invoiceNumber,
      buyerId,
      buyerEmail,
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
      return NextResponse.json({ message: "invoiceNumber is required" }, { status: 400 });
    }
    let buyer = null;
    if (buyerId) {
      buyer = await User.findById(buyerId);
    } else if (buyerEmail && String(buyerEmail).trim()) {
      buyer = await User.findOne({
        email: String(buyerEmail).trim().toLowerCase(),
        userType: "Buyer",
      });
    } else {
      buyer = await User.findOne({ userType: "Buyer" }).sort({ createdAt: 1 });
    }

    if (!buyer || buyer.userType !== "Buyer") {
      return NextResponse.json({ message: "Valid buyer is required" }, { status: 400 });
    }

    const issue = normalizeDate(issueDate);
    const delivery = normalizeDate(deliveryDate);
    if (!issue || !delivery) {
      return NextResponse.json({ message: "Valid issueDate and deliveryDate are required" }, { status: 400 });
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
      companyId: user.effectiveCompanyId, // Data Isolation Link
      sellerName: user.name || "",
      sellerEmail: user.email || "",
      buyerName: buyer.name || "",
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

    return NextResponse.json(
      {
        message: "Invoice created",
        invoice: created,
        approvalRequestSent,
        approvalRequestError,
      },
      { status: 201 },
    );
  } catch (error) {
    const dup = error?.code === 11000;
    return NextResponse.json(
      { message: dup ? "Invoice number already exists for this seller" : "Server error" },
      { status: dup ? 409 : 500 },
    );
  }
}
