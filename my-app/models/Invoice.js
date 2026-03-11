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
  },
  { timestamps: true },
);

InvoiceSchema.index({ sellerId: 1, invoiceNumber: 1 }, { unique: true });

export default mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
