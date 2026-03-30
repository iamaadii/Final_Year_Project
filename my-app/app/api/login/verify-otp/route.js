import crypto from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { parseBody, successResponse, errorResponse } from "@/lib/api/routeUtils";

const LoginOtpSchema = z.object({
  challengeToken: z.string().min(1),
  otp: z.string().min(1),
});

export async function POST(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  try {
    await dbConnect();
    const parsed = await parseBody(req, LoginOtpSchema, requestId);
    if (!parsed.ok) return parsed.response;

    const { challengeToken, otp } = parsed.data;

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return errorResponse("SERVER_ERROR", "JWT secret is not configured", 500, requestId);
    }

    let payload;
    try {
      payload = jwt.verify(challengeToken, secret);
    } catch {
      return errorResponse("UNAUTHORIZED", "OTP session expired. Please login again.", 401, requestId);
    }

    if (payload.purpose !== "login-2fa" || !payload.email) {
      return errorResponse("UNAUTHORIZED", "Invalid OTP session", 401, requestId);
    }

    const user = await User.findOne({ email: payload.email });
    if (!user || !user.loginOtp || !user.loginOtpExpiry) {
      return errorResponse("INVALID_REQUEST", "No OTP request found. Please login again.", 400, requestId);
    }

    const isExpired = new Date() > new Date(user.loginOtpExpiry);
    const isMismatch = user.loginOtp !== otp.trim();

    if (isExpired || isMismatch) {
      return errorResponse("INVALID_OTP", "Invalid or expired OTP", 400, requestId);
    }

    user.loginOtp = null;
    user.loginOtpExpiry = null;
    await user.save();

    const authToken = jwt.sign(
      { id: user._id.toString(), email: user.email },
      secret,
      { expiresIn: "1d" }
    );

    const res = successResponse({ message: "Login successful" }, 200, requestId);

    res.cookies.set("accessToken", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    res.cookies.set("token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (error) {
    console.error("LOGIN VERIFY OTP ERROR:", error);
    return errorResponse("SERVER_ERROR", "Server error", 500, requestId);
  }
}
