import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { generateTokens, storeRefreshToken } from "@/lib/auth-node";
import { getToken } from "@/lib/redis";

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + "_refresh");

export async function POST(req) {
  const refreshToken = req.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "Refresh token missing" }, { status: 401 });
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
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    // Redis check for revocation
    const tokenKey = `rt:${refreshToken.slice(-10)}`;
    const redisUser = await getToken(tokenKey);
    if (!redisUser && process.env.REDIS_URL) {
      return NextResponse.json({ message: "Session revoked" }, { status: 401 });
    }

    // Rotate Tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    await storeRefreshToken(user, newRefreshToken);

    const response = NextResponse.json({ success: true });
    
    response.cookies.set("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 mins
    });

    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err) {
    return NextResponse.json({ message: "Invalid refresh token" }, { status: 401 });
  }
}
