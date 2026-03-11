import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req) {
  try {
    await dbConnect();
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const formattedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: formattedEmail });

    if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpiry) {
      return NextResponse.json(
        { message: "Invalid OTP request" },
        { status: 400 }
      );
    }

    const isExpired = new Date() > new Date(user.passwordResetOtpExpiry);
    const isMismatch = user.passwordResetOtp !== otp.trim();

    if (isExpired || isMismatch) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    user.passwordResetOtp = null;
    user.passwordResetOtpExpiry = null;
    await user.save();

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { message: "JWT secret is not configured" },
        { status: 500 }
      );
    }

    const resetToken = jwt.sign(
      { email: user.email, purpose: "password-reset" },
      secret,
      { expiresIn: "10m" }
    );

    return NextResponse.json(
      { message: "OTP verified", resetToken },
      { status: 200 }
    );
  } catch (error) {
    console.error("FORGOT PASSWORD VERIFY OTP ERROR:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
