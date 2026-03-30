import mongoose from "mongoose";

const JournalEntryLineSchema = new mongoose.Schema(
  {
    accountCode: { type: String, required: true, trim: true },
    accountName: { type: String, default: "", trim: true },
    debitAmount: { type: Number, default: 0, min: 0 },
    creditAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const JournalEntrySchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, index: true },
    entryDate: { type: Date, required: true },
    referenceType: {
      type: String,
      enum: ["invoice", "payment", "tds", "manual"],
      required: true,
    },
    referenceId: { type: String, default: null, index: true },
    narration: { type: String, required: true, trim: true },
    lines: { type: [JournalEntryLineSchema], default: [] },
    createdBy: { type: String, required: true, trim: true },
    createdByName: { type: String, default: "", trim: true },
    isReversed: { type: Boolean, default: false },
    reversedBy: { type: String, default: null, trim: true },
  },
  { timestamps: true },
);

JournalEntrySchema.index({ companyId: 1, entryDate: -1 });
JournalEntrySchema.index({ referenceId: 1 });

JournalEntrySchema.pre("save", function(next) {
  this._wasNew = this.isNew;
  next();
});

JournalEntrySchema.post("save", async function(doc) {
  try {
    const action = doc._wasNew ? "CREATE" : "UPDATE";
    const AuditLog = mongoose.models.AuditLog || (await import("./AuditLog")).default;
    await AuditLog.create({
      companyId: doc.companyId,
      userId: null,
      userName: doc.createdByName || doc.createdBy || "System",
      action,
      resource: "JournalEntry",
      resourceId: doc._id,
      details: { referenceType: doc.referenceType, isReversed: doc.isReversed }
    });
  } catch (err) {
    console.error("AuditLog failure for JournalEntry", err);
  }
});

export default mongoose.models.JournalEntry || mongoose.model("JournalEntry", JournalEntrySchema);
