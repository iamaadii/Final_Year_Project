import mongoose from "mongoose";
const udyamRegex = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;

const BankAccountSchema = new mongoose.Schema(
  {
    bank: { type: String, required: true, trim: true },
    account: { type: String, required: true, trim: true },
    accountHolderName: { type: String, default: "", trim: true },
    status: { type: String, default: "Pending", trim: true },
    logoText: { type: String, default: "BNK", trim: true },
    logoSrc: { type: String, default: "", trim: true },
  },
  { _id: false },
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
    gstNumber: { type: String, default: "" },
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
    contactNumber: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    passwordResetOtp: { type: String, default: null },
    passwordResetOtpExpiry: { type: Date, default: null },
    loginOtp: { type: String, default: null },
    loginOtpExpiry: { type: Date, default: null },
    bankAccounts: { type: [BankAccountSchema], default: [] },
    teamMembers: { type: [TeamMemberSchema], default: [] },
  },
  { timestamps: true },
);
export default mongoose.models.User || mongoose.model("User", UserSchema);
