import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    userName: String,
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true }, // e.g., "Invoice", "User", "Auth"
    resourceId: mongoose.Schema.Types.ObjectId,
    details: { type: mongoose.Schema.Types.Mixed },
    ip: String,
    userAgent: String,
    status: { type: String, enum: ["success", "failure"], default: "success" },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { 
    timestamps: false, // We use our own timestamp
    capped: false // Not capped, we want persistent history
  }
);

// RBAC/Security: Make the collection semi-immutable at the schema level
// We overwrite the remove, update, and delete methods to do nothing or throw errors
AuditLogSchema.pre("save", async function() {
  if (!this.isNew) {
    throw new Error("Audit logs are append-only and cannot be modified.");
  }
});

AuditLogSchema.pre(["updateOne", "updateMany", "findOneAndUpdate", "findByIdAndUpdate"], async function() {
  throw new Error("Audit logs are append-only and cannot be updated.");
});

AuditLogSchema.pre(["deleteOne", "deleteMany", "findOneAndDelete", "findByIdAndDelete"], async function() {
  throw new Error("Audit logs are append-only and cannot be deleted.");
});

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
