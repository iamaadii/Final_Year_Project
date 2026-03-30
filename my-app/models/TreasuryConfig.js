import mongoose from "mongoose";

const TreasuryConfigSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, unique: true, index: true },
    poolCr: { type: Number, default: 0, min: 0 },
    targetApr: { type: Number, default: 0, min: 0 },
    paused: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.TreasuryConfig || mongoose.model("TreasuryConfig", TreasuryConfigSchema);
