import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { validatePassword } from "@/lib/validators";

export async function POST(req) {
  try {
    await dbConnect();
    const { resetToken, newPassword, confirmPassword } = await req.json();

    if (!resetToken || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "Passwords do not match" },
        { status: 400 }
      );
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return NextResponse.json(
        { message: passwordError },
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
      payload = jwt.verify(resetToken, secret);
    } catch {
      return NextResponse.json(
        { message: "Reset session expired. Please try again." },
        { status: 401 }
      );
    }

    if (payload.purpose !== "password-reset" || !payload.email) {
      return NextResponse.json(
        { message: "Invalid reset token" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: payload.email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetOtp = null;
    user.passwordResetOtpExpiry = null;
    await user.save();

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("FORGOT PASSWORD RESET ERROR:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
