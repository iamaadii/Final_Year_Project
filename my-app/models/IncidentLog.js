import mongoose from "mongoose";

const IncidentLogSchema = new mongoose.Schema(
  {
    reportedBy: { type: String, required: true, trim: true },
    detectedAt: { type: Date, required: true },
    reportedAt: { type: Date, default: Date.now },
    description: { type: String, required: true, trim: true },
    severity: { type: String, enum: ["low", "medium", "high", "critical"], required: true },
    affectedUserIds: { type: [String], default: [] },
    dataTypes: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["open", "investigating", "reported_to_dpbi", "resolved"],
      default: "open",
    },
    dpdpNotificationSentAt: { type: Date, default: null },
    resolutionNotes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export default mongoose.models.IncidentLog || mongoose.model("IncidentLog", IncidentLogSchema);
