import crypto from "crypto";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { rateLimit } from "@/lib/redis";
import { parseBody, successResponse, errorResponse } from "@/lib/api/routeUtils";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  redirectTo: z.string().optional(),
});

function resolveRedirectPath(userType) {
  if (userType === "Seller") return "/seller/dashboard";
  if (userType === "Financier") return "/financier/dashboard";
  return "/buyer/dashboard";
}

function sanitizeRedirectPath(pathname) {
  if (!pathname || typeof pathname !== "string") return null;
  if (!pathname.startsWith("/")) return null;
  if (pathname.startsWith("//")) return null;
  const blocked = ["/login", "/register", "/forgot-password", "/reset-password", "/verification"];
  if (blocked.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return null;
  return pathname;
}

export async function POST(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  try {
    const ip = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";
    const isAllowed = await rateLimit(`login:${ip}`, 10, 60); // 10 attempts per minute
    if (!isAllowed) {
      return errorResponse("RATE_LIMITED", "Too many login attempts, please try again later", 429, requestId);
    }

    await dbConnect();

    const parsed = await parseBody(req, LoginSchema, requestId);
    if (!parsed.ok) return parsed.response;
    const { email, password, redirectTo: requestedRedirectTo } = parsed.data;

    const formattedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: formattedEmail });

    if (!user) {
      return errorResponse("INVALID_CREDENTIALS", "Invalid credentials", 401, requestId);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return errorResponse("INVALID_CREDENTIALS", "Invalid credentials", 401, requestId);
    }

    const roleRedirect = resolveRedirectPath(user.userType);
    const safeRedirect = sanitizeRedirectPath(requestedRedirectTo);
    const redirectTo = safeRedirect || roleRedirect;

    const sessionPayload = {
      userId: user._id.toString(),
      tenantId: user.companyId?.toString() || "",
      role: user.role || "view_only",
      userType: user.userType,
      hasCompletedOnboarding: Boolean(user.hasCompletedOnboarding),
    };

    const accessToken = await signAccessToken(sessionPayload);
    const refreshToken = await signRefreshToken(sessionPayload);

    // Also save refresh token to user record if supported
    user.refreshToken = refreshToken;
    await user.save();

    const res = successResponse({ message: "Login successful", redirectTo }, 200, requestId);

    res.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15, // 15 minutes
    });

    res.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return errorResponse("SERVER_ERROR", "Server error", 500, requestId);
  }
}
