import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req) {
  try {
    await dbConnect();
    const { challengeToken, otp } = await req.json();

    if (!challengeToken || !otp) {
      return NextResponse.json(
        { message: "OTP verification details are required" },
        { status: 400 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { message: "JWT secret is not configured" },
        { status: 500 }
      );
    }

    let payload;
    try {
      payload = jwt.verify(challengeToken, secret);
    } catch {
      return NextResponse.json(
        { message: "OTP session expired. Please login again." },
        { status: 401 }
      );
    }

    if (payload.purpose !== "login-2fa" || !payload.email) {
      return NextResponse.json(
        { message: "Invalid OTP session" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: payload.email });
    if (!user || !user.loginOtp || !user.loginOtpExpiry) {
      return NextResponse.json(
        { message: "No OTP request found. Please login again." },
        { status: 400 }
      );
    }

    const isExpired = new Date() > new Date(user.loginOtpExpiry);
    const isMismatch = user.loginOtp !== otp.trim();

    if (isExpired || isMismatch) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    user.loginOtp = null;
    user.loginOtpExpiry = null;
    await user.save();

    const authToken = jwt.sign(
      { id: user._id.toString(), email: user.email },
      secret,
      { expiresIn: "1d" }
    );

    const res = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

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
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
