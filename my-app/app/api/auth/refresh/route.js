import crypto from "crypto";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { generateTokens, storeRefreshToken } from "@/lib/auth-node";
import { getToken } from "@/lib/redis";
import { successResponse, errorResponse } from "@/lib/api/routeUtils";

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + "_refresh");

export async function POST(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const refreshToken = req.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    return errorResponse("UNAUTHORIZED", "Refresh token missing", 401, requestId);
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    await dbConnect();
    
    const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== refreshToken) {
      // Token mismatch or reuse detection
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
      return errorResponse("UNAUTHORIZED", "Invalid session", 401, requestId);
    }

    // Redis check for revocation
    const tokenKey = `rt:${refreshToken.slice(-10)}`;
    const redisUser = await getToken(tokenKey);
    if (!redisUser && process.env.REDIS_URL) {
      return errorResponse("UNAUTHORIZED", "Session revoked", 401, requestId);
    }

    // Rotate Tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    await storeRefreshToken(user, newRefreshToken);

    const response = successResponse({ message: "Session refreshed" }, 200, requestId);
    
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60, // 15 mins
    });

    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch {
    return errorResponse("UNAUTHORIZED", "Invalid refresh token", 401, requestId);
  }
}
