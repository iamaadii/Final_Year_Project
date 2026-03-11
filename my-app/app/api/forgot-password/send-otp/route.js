import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const formattedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: formattedEmail });

    if (!user) {
      return NextResponse.json(
        { message: "No account found with this email" },
        { status: 404 }
      );
    }

    const otp = generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.passwordResetOtp = otp;
    user.passwordResetOtpExpiry = expiry;
    await user.save();

    await sendEmail({
      to: formattedEmail,
      subject: "Your Password Reset OTP",
      html: `<p>Your password reset OTP is <b>${otp}</b>. It will expire in 10 minutes.</p>`,
    });

    return NextResponse.json(
      { message: "OTP sent to your registered email" },
      { status: 200 }
    );
  } catch (error) {
    console.error("FORGOT PASSWORD SEND OTP ERROR:", error);
    const message = error instanceof Error ? error.message : "Server error";
    const emailConfigError = message.includes("Email is not configured");
    const emailSendError = message.includes("Email send failed");
    return NextResponse.json(
      {
        message: emailConfigError || emailSendError
          ? "Unable to send OTP email. Configure RESEND_API_KEY and MAIL_FROM in .env.local."
          : "Server error",
      },
      { status: emailConfigError || emailSendError ? 503 : 500 }
    );
  }
}
