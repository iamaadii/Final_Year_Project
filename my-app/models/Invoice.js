import mongoose from "mongoose";
import { encryptPII, decryptPII } from "@/lib/encryption";
const LineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const ReminderPolicySchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    startAfterDays: { type: Number, default: 45, min: 1 },
    intervalDays: { type: Number, default: 2, min: 1 },
    lastReminderSentAt: { type: Date, default: null },
    nextReminderAt: { type: Date, default: null },
    remindersSentCount: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const ApprovalHistorySchema = new mongoose.Schema(
  {
    level: { type: Number, default: 0 },
    action: { type: String, enum: ["approved", "rejected", "delegated"], required: true },
    userId: { type: String, default: "" },
    userName: { type: String, default: "" },
    notes: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, trim: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerName: { type: String, required: true, trim: true },
    sellerEmail: { type: String, required: true, trim: true, lowercase: true },
    buyerName: { type: String, required: true, trim: true },
    buyerEmail: { type: String, required: true, trim: true, lowercase: true },
    buyerCompanyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    sellerCompanyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true }, // Ownership link
    issueDate: { type: Date, required: true },
    deliveryDate: { type: Date, required: true, index: true },
    dueDate: { type: Date, required: true, index: true },
    currency: { type: String, default: "INR", trim: true, uppercase: true },
    subtotalAmount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentTermsDays: { type: Number, default: 45, min: 1 },
    status: {
      type: String,
      enum: [
        "Draft",
        "Pending Approval",
        "Approved",
        "Partially Settled",
        "Paid",
        "Settled",
        "Overdue",
        "Under Review",
        "Disputed",
        "draft",
        "pending",
        "paid",
        "cancelled",
      ],
      default: "Pending Approval",
      index: true,
    },
    financingStatus: {
      type: String,
      enum: ["Not Requested", "Pending Finance", "Funded", "Repaid", "Rejected"],
      default: "Not Requested",
      index: true,
    },
    isFinanced: { type: Boolean, default: false, index: true },
    notes: { type: String, default: "", trim: true },
    lineItems: { type: [LineItemSchema], default: [] },
    reminderPolicy: { type: ReminderPolicySchema, default: () => ({}) },
    paymentReceivedAt: { type: Date, default: null },
    amountPaid: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false, index: true },

    // PO / GRN linkage for 3-way matching
    poId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", default: null },
    grnId: { type: mongoose.Schema.Types.ObjectId, ref: "GRN", default: null, index: true },

    // GST fields
    sellerGstin: { type: String, default: "", trim: true, uppercase: true },
    buyerGstin: { type: String, default: "", trim: true, uppercase: true },
    hsnCodes: { type: [String], default: [] },

    // AI 3-way match result
    matchResult: {
      decision: { type: String, enum: ["AUTO_APPROVE", "NEEDS_REVIEW", "HARD_REJECT", "MANUAL_OVERRIDE", ""], default: "" },
      confidenceScore: { type: Number, default: 0 },
      varianceFlags: { type: [mongoose.Schema.Types.Mixed], default: [] },
      maxVariancePct: { type: Number, default: 0 },
      matchedAt: { type: Date, default: null },
      overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      overrideReason: { type: String, default: "" },
    },

    // MSMED compliance
    msmedDeadline: { type: Date, default: null },
    penaltyAccrued: { type: Number, default: 0, min: 0 },

    // E-invoicing (GST IRP)
    eInvoiceIRN: { type: String, default: null },
    eInvoiceAckNo: { type: String, default: null },
    eInvoiceAckDate: { type: Date, default: null },
    eInvoiceQRCode: { type: String, default: null },
    eInvoiceStatus: {
      type: String,
      enum: ["not_required", "pending", "submitted", "cancelled"],
      default: "not_required",
    },

    // TDS
    tdsAmount: { type: Number, default: 0, min: 0 },
    tdsRate: { type: Number, default: 0, min: 0 },
    tdsSection: { type: String, default: null },

    // AI enhancements
    glCodeSuggestion: { type: String, default: null },
    glCodeConfidence: { type: Number, default: null, min: 0, max: 1 },
    ocrConfidence: { type: Number, default: null, min: 0, max: 1 },
    ocrNeedsReview: { type: Boolean, default: false },
    ocrExtracted: { type: mongoose.Schema.Types.Mixed, default: null },
    ocrLowConfidenceFields: { type: [String], default: [] },
    ocrReviewedAt: { type: Date, default: null },

    // Payment recording
    paymentUTR: { type: String, default: null },
    paymentMode: {
      type: String,
      enum: ["upi", "neft", "rtgs", "cheque", "manual", null],
      default: null,
    },
    paymentLinkId: { type: String, default: null },
    paymentLinkUrl: { type: String, default: null },

    samadhaanDraftId: { type: String, default: null },

    // Approval workflow
    approvalLevel: { type: Number, default: 0, min: 0 },
    approvalStatus: {
      type: String,
      enum: ["not_required", "pending", "approved", "rejected"],
      default: "not_required",
    },
    approvalHistory: { type: [ApprovalHistorySchema], default: [] },

    // Data Isolation (Redundant with buyerCompanyId/sellerCompanyId for ownership tracking)
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },

    // Dynamic discounting offer
    discountOffer: {
      offeredAt: { type: Date, default: null },
      discountAmount: { type: Number, default: 0, min: 0 },
      discountRate: { type: Number, default: 0, min: 0 },
      daysAccelerated: { type: Number, default: 0 },
      status: { type: String, enum: ["none", "offered", "accepted", "declined"], default: "none" },
      acceptedAt: { type: Date, default: null },
      earlyPaymentAmount: { type: Number, default: 0 },
    },

    // Dispute tracking
    disputeReason: { type: String, default: "", trim: true },
    disputeRaisedAt: { type: Date, default: null },

    // Audit trail
    auditTrail: {
      type: [
        {
          action: { type: String, required: true },
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          userName: { type: String, default: "" },
          timestamp: { type: Date, default: Date.now },
          details: { type: String, default: "" },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

// PII Encryption for Invoices

InvoiceSchema.pre("save", async function() {
  if (this.isModified("sellerGstin") && this.sellerGstin) {
    this.sellerGstin = encryptPII(this.sellerGstin);
  }
  if (this.isModified("buyerGstin") && this.buyerGstin) {
    this.buyerGstin = encryptPII(this.buyerGstin);
  }
});

InvoiceSchema.methods.getDecryptedGst = function() {
  return {
    sellerGstin: decryptPII(this.sellerGstin),
    buyerGstin: decryptPII(this.buyerGstin),
  };
};

InvoiceSchema.index({ sellerId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ companyId: 1, status: 1 });
InvoiceSchema.index({ companyId: 1, dueDate: 1 });
InvoiceSchema.index({ buyerId: 1, status: 1 });
InvoiceSchema.index({ sellerId: 1, dueDate: 1 });

InvoiceSchema.pre("save", async function() {
  this._wasNew = this.isNew;
});

InvoiceSchema.post("save", async function(doc) {
  try {
    const action = doc._wasNew ? "CREATE" : "UPDATE";
    const AuditLog = mongoose.models.AuditLog || (await import("./AuditLog")).default;
    await AuditLog.create({
      companyId: doc.companyId,
      userId: doc.sellerId,
      userName: doc.sellerName || "System",
      action,
      resource: "Invoice",
      resourceId: doc._id,
      details: { status: doc.status, totalAmount: doc.totalAmount, invoiceNumber: doc.invoiceNumber }
    });
  } catch (err) {
    console.error("AuditLog failure for Invoice", err);
  }
});

export default mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
