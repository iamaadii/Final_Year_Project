import crypto from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { parseBody, successResponse, errorResponse } from "@/lib/api/routeUtils";

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(1),
});

export async function POST(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  try {
    await dbConnect();
    const parsed = await parseBody(req, VerifyOtpSchema, requestId);
    if (!parsed.ok) return parsed.response;

    const { email, otp } = parsed.data;

    const formattedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: formattedEmail });

    if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpiry) {
      return errorResponse("INVALID_REQUEST", "Invalid OTP request", 400, requestId);
    }

    const isExpired = new Date() > new Date(user.passwordResetOtpExpiry);
    const isMismatch = user.passwordResetOtp !== otp.trim();

    if (isExpired || isMismatch) {
      return errorResponse("INVALID_OTP", "Invalid or expired OTP", 400, requestId);
    }

    user.passwordResetOtp = null;
    user.passwordResetOtpExpiry = null;
    await user.save();

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return errorResponse("SERVER_ERROR", "JWT secret is not configured", 500, requestId);
    }

    const resetToken = jwt.sign(
      { email: user.email, purpose: "password-reset" },
      secret,
      { expiresIn: "10m" }
    );

    return successResponse({ message: "OTP verified", resetToken }, 200, requestId);
  } catch (error) {
    console.error("FORGOT PASSWORD VERIFY OTP ERROR:", error);
    return errorResponse("SERVER_ERROR", "Server error", 500, requestId);
  }
}
