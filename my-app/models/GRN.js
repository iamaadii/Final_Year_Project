import mongoose from "mongoose";

const GRNLineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    orderedQty: { type: Number, required: true, min: 0 },
    acceptedQty: { type: Number, required: true, min: 0 },
    rejectedQty: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const GoodsReceiptNoteSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, trim: true },
    poId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true, index: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    buyerName: { type: String, default: "", trim: true },
    sellerName: { type: String, default: "", trim: true },
    buyerCompanyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    sellerCompanyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true }, // Ownership link
    lineItems: { type: [GRNLineItemSchema], default: [] },
    qualityCheckPassed: { type: Boolean, default: true },
    receivedDate: { type: Date, default: Date.now },
    notes: { type: String, default: "", trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

GoodsReceiptNoteSchema.index({ buyerId: 1, grnNumber: 1 }, { unique: true });

export default mongoose.models.GoodsReceiptNote || mongoose.model("GoodsReceiptNote", GoodsReceiptNoteSchema);
