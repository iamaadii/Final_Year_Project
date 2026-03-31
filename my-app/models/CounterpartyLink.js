import mongoose from "mongoose";

const CounterpartyLinkSchema = new mongoose.Schema(
  {
    inviterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    inviterCompanyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    
    // The counterparty can be an existing user or a placeholder (by GSTIN/Email)
    inviteeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    inviteeGstin: { type: String, trim: true, uppercase: true },
    inviteeEmail: { type: String, trim: true, lowercase: true },
    inviteeName: { type: String, trim: true },
    
    status: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "pending",
      index: true,
    },
    
    // Whether the inviter is the Seller (linking a Buyer) or Buyer (linking a Vendor)
    linkType: {
      type: String,
      enum: ["buyer", "vendor"], // inviter perspective: "I am adding a buyer" or "I am adding a vendor"
      required: true,
    },
    
    // Performance metrics (cached/calculated)
    avgPaymentDays: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Ensure a company cannot link the same GSTIN multiple times
CounterpartyLinkSchema.index({ inviterCompanyId: 1, inviteeGstin: 1, linkType: 1 }, { unique: true });

export default mongoose.models.CounterpartyLink || mongoose.model("CounterpartyLink", CounterpartyLinkSchema);
