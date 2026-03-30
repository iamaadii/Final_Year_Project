import mongoose from "mongoose";

const ChartOfAccountSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, index: true },
    accountCode: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    accountType: {
      type: String,
      enum: ["asset", "liability", "income", "expense", "equity"],
      required: true,
    },
    parentCode: { type: String, default: null, trim: true },
    isActive: { type: Boolean, default: true },
    hsnCodes: { type: [String], default: [] },
  },
  { timestamps: true },
);

ChartOfAccountSchema.index({ companyId: 1, accountCode: 1 }, { unique: true });

export default mongoose.models.ChartOfAccount || mongoose.model("ChartOfAccount", ChartOfAccountSchema);
