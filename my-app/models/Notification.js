import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, trim: true },
    companyId: { type: String, required: true, index: true, trim: true },
    type: {
      type: String,
      enum: [
        "invoice_due", "invoice_overdue", "invoice_paid", "invoice_partially_settled",
        "match_failed", "match_success",
        "compliance_warning", "compliance_critical", "compliance_breach",
        "approval_required", "approval_done", "approval_rejected",
        "reminder_sent", "dispute_raised", "dispute_resolved",
        "ocr_review_required", "einvoice_submitted", "einvoice_failed",
        "erp_sync_success", "erp_sync_failed",
        "connection_invite", "connection_accepted", "financing_requested", "financing_approved",
        "system",
      ],
      required: true,
    },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    entityType: { type: String, default: null, trim: true },
    entityId: { type: String, default: null, trim: true },
    actionUrl: { type: String, default: null, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
