import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { validatePassword } from "@/lib/validators";
import { parseBody, successResponse, errorResponse } from "@/lib/api/routeUtils";

const ResetPasswordSchema = z.object({
  resetToken: z.string().min(1),
  newPassword: z.string().min(1),
  confirmPassword: z.string().min(1),
});

export async function POST(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  try {
    await dbConnect();
    const parsed = await parseBody(req, ResetPasswordSchema, requestId);
    if (!parsed.ok) return parsed.response;

    const { resetToken, newPassword, confirmPassword } = parsed.data;

    if (newPassword !== confirmPassword) {
      return errorResponse("VALIDATION_ERROR", "Passwords do not match", 400, requestId);
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return errorResponse("VALIDATION_ERROR", passwordError, 400, requestId);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return errorResponse("SERVER_ERROR", "JWT secret is not configured", 500, requestId);
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, secret);
    } catch {
      return errorResponse("UNAUTHORIZED", "Reset session expired. Please try again.", 401, requestId);
    }

    if (payload.purpose !== "password-reset" || !payload.email) {
      return errorResponse("UNAUTHORIZED", "Invalid reset token", 401, requestId);
    }

    const user = await User.findOne({ email: payload.email });
    if (!user) {
      return errorResponse("NOT_FOUND", "User not found", 404, requestId);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetOtp = null;
    user.passwordResetOtpExpiry = null;
    await user.save();

    return successResponse({ message: "Password reset successful" }, 200, requestId);
  } catch (error) {
    console.error("FORGOT PASSWORD RESET ERROR:", error);
    return errorResponse("SERVER_ERROR", "Server error", 500, requestId);
  }
}
