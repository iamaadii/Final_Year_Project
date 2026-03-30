import mongoose from "mongoose";

const OcrFeedbackSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalExtracted: { type: mongoose.Schema.Types.Mixed, default: null },
    correctedFields: { type: mongoose.Schema.Types.Mixed, default: null },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

OcrFeedbackSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.models.OcrFeedback || mongoose.model("OcrFeedback", OcrFeedbackSchema);
