import mongoose from "mongoose";
const udyamRegex = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;

const BankAccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bank: { type: String, required: true, trim: true },
    account: { type: String, required: true, trim: true },
    accountHolderName: { type: String, default: "", trim: true },
    accountNumberEncrypted: { type: String, default: "", trim: true },
    accountNumberLast4: { type: String, default: "", trim: true },
    ifscCode: { type: String, default: "", trim: true, uppercase: true },
    bankName: { type: String, default: "", trim: true },
    branchName: { type: String, default: "", trim: true },
    isVerified: { type: Boolean, default: false },
    nameMatchStatus: {
      type: String,
      enum: ["matched", "partial", "unmatched"],
      default: "unmatched",
      trim: true,
    },
    verifiedAt: { type: Date, default: null },
    verificationProvider: {
      type: String,
      enum: ["razorpay", "cashfree", "manual"],
      default: "manual",
      trim: true,
    },
    verificationReferenceId: { type: String, default: "", trim: true },
    status: { type: String, default: "Pending", trim: true },
    logoText: { type: String, default: "BNK", trim: true },
    logoSrc: { type: String, default: "", trim: true },
  },
  { _id: false, timestamps: true },
);

const TeamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "Team Member", trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    role: { type: String, default: "View Only", trim: true },
    status: { type: String, default: "Pending", trim: true },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: {
      type: String,
      enum: ["Buyer", "Seller", "Financier"],
      required: true,
    },
    // RBAC
    role: {
      type: String,
      enum: ["super_admin", "company_admin", "ap_manager", "ap_clerk", "view_only"],
      default: "view_only",
      index: true,
    },
    // Multi-tenancy / Isolation
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    companyName: { type: String, trim: true },

    // PII (Stored Encrypted)
    gstNumber: { type: String, default: "" }, // Will be encrypted in pre-save
    panNumber: { type: String, default: "", trim: true, uppercase: true },
    udhyamNumber: {
      type: String,
      trim: true,
      uppercase: true,
      validate: {
        validator(value) {
          if (!value) return true;
          return udyamRegex.test(value);
        },
        message: "Invalid Udyam number format",
      },
    },
    
    // Security & Gating
    kycStatus: {
      type: String,
      enum: ["pending", "submitted", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null }, // Encrypted
    
    contactNumber: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    
    passwordResetOtp: { type: String, default: null },
    passwordResetOtpExpiry: { type: Date, default: null },
    loginOtp: { type: String, default: null },
    loginOtpExpiry: { type: Date, default: null },
    
    // Tokens for rotation
    refreshToken: { type: String, default: null },
    
    bankAccounts: { type: [BankAccountSchema], default: [] },
    teamMembers: { type: [TeamMemberSchema], default: [] },
  },
  { timestamps: true },
);

// PII Encryption Middleware
import { encryptPII, decryptPII } from "@/lib/encryption";

UserSchema.pre("save", function(next) {
  if (this.isModified("gstNumber") && this.gstNumber) {
    this.gstNumber = encryptPII(this.gstNumber);
  }
  if (this.isModified("panNumber") && this.panNumber) {
    this.panNumber = encryptPII(this.panNumber);
  }
  if (this.isModified("mfaSecret") && this.mfaSecret) {
    this.mfaSecret = encryptPII(this.mfaSecret);
  }
  next();
});

// Decryption helper method
UserSchema.methods.getDecryptedData = function() {
  return {
    gstNumber: decryptPII(this.gstNumber),
    panNumber: decryptPII(this.panNumber),
  };
};

export default mongoose.models.User || mongoose.model("User", UserSchema);
