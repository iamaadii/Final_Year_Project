import mongoose from "mongoose";

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

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, trim: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerName: { type: String, required: true, trim: true },
    sellerEmail: { type: String, required: true, trim: true, lowercase: true },
    buyerName: { type: String, required: true, trim: true },
    buyerEmail: { type: String, required: true, trim: true, lowercase: true },
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
      enum: ["Draft", "Pending Approval", "Approved", "Partially Settled", "Settled", "Overdue", "Disputed"],
      default: "Pending Approval",
      index: true,
    },
    notes: { type: String, default: "", trim: true },
    lineItems: { type: [LineItemSchema], default: [] },
    reminderPolicy: { type: ReminderPolicySchema, default: () => ({}) },
    paymentReceivedAt: { type: Date, default: null },
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

    // Data Isolation
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true }, // Ownership link

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
import { encryptPII, decryptPII } from "@/lib/encryption";

InvoiceSchema.pre("save", function(next) {
  if (this.isModified("sellerGstin") && this.sellerGstin) {
    this.sellerGstin = encryptPII(this.sellerGstin);
  }
  if (this.isModified("buyerGstin") && this.buyerGstin) {
    this.buyerGstin = encryptPII(this.buyerGstin);
  }
  next();
});

InvoiceSchema.methods.getDecryptedGst = function() {
  return {
    sellerGstin: decryptPII(this.sellerGstin),
    buyerGstin: decryptPII(this.buyerGstin),
  };
};

InvoiceSchema.index({ sellerId: 1, invoiceNumber: 1 }, { unique: true });

export default mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
