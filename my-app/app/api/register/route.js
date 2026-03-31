import crypto from "crypto";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { isValidEmail, validatePassword } from "@/lib/validators";
import { parseBody, successResponse, errorResponse } from "@/lib/api/routeUtils";

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  userType: z.enum(["Buyer", "Seller", "Financier"]),
  companyName: z.string().min(1),
  designation: z.string().optional(),
  dpdpConsent: z.boolean().optional(),
});

const DPDP_CONSENT_VERSION = "v1.0";
const DEFAULT_DPDP_PURPOSES = [
  "account_operations",
  "compliance_notifications",
  "product_analytics",
];

export async function POST(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  try {
    await dbConnect();

    const parsed = await parseBody(req, RegisterSchema, requestId);
    if (!parsed.ok) return parsed.response;
    const { name, email, password, userType, companyName, designation, dpdpConsent } = parsed.data;

    const formattedEmail = email.toLowerCase().trim();
    if (!isValidEmail(formattedEmail)) {
      return errorResponse("VALIDATION_ERROR", "Please enter a valid email address", 400, requestId);
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return errorResponse("VALIDATION_ERROR", passwordError, 400, requestId);
    }

    const existingUser = await User.findOne({
      email: formattedEmail,
    });

    if (existingUser) {
      return errorResponse("DUPLICATE", "User already exists", 400, requestId);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const now = new Date();
    const consentGranted = Boolean(dpdpConsent);
    const consentPurposes = consentGranted
      ? DEFAULT_DPDP_PURPOSES.map((purpose) => ({
          purpose,
          granted: true,
          timestamp: now,
        }))
      : [];

    const newUser = await User.create({
      name,
      email: formattedEmail,
      password: hashedPassword,
      userType,
      companyName,
      designation: designation || "",
      dpdpConsentVersion: consentGranted ? DPDP_CONSENT_VERSION : null,
      dpdpConsentTimestamp: consentGranted ? now : null,
      dpdpConsentPurposes: consentPurposes,
    });

    const sessionPayload = {
      userId: newUser._id.toString(),
      tenantId: newUser.companyId?.toString() || "",
      role: newUser.role || "view_only",
      userType: newUser.userType,
      hasCompletedOnboarding: Boolean(newUser.hasCompletedOnboarding),
    };

    const accessToken = await signAccessToken(sessionPayload);
    const refreshToken = await signRefreshToken(sessionPayload);

    // Also save refresh token to user record if supported
    newUser.refreshToken = refreshToken;
    await newUser.save();

    const res = successResponse({ message: "User registered successfully" }, 201, requestId);

    res.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });

    res.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return errorResponse("SERVER_ERROR", "Internal Server Error", 500, requestId);
  }
}
