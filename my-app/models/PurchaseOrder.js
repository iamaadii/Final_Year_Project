import mongoose from "mongoose";

const POLineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    hsnCode: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const PurchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, trim: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    buyerName: { type: String, default: "", trim: true },
    sellerName: { type: String, default: "", trim: true },
    buyerCompanyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    sellerCompanyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true }, // Ownership link
    lineItems: { type: [POLineItemSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", trim: true, uppercase: true },
    status: {
      type: String,
      enum: ["Open", "Partially Received", "Fully Received", "Closed", "Cancelled"],
      default: "Open",
      index: true,
    },
    notes: { type: String, default: "", trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

PurchaseOrderSchema.index({ buyerId: 1, poNumber: 1 }, { unique: true });

export default mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", PurchaseOrderSchema);
