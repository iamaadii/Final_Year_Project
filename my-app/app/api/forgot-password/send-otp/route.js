import crypto from "crypto";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";
import { parseBody, successResponse, errorResponse } from "@/lib/api/routeUtils";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const SendOtpSchema = z.object({
  email: z.string().email(),
});

export async function POST(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  try {
    await dbConnect();
    const parsed = await parseBody(req, SendOtpSchema, requestId);
    if (!parsed.ok) return parsed.response;

    const { email } = parsed.data;

    const formattedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: formattedEmail });

    if (!user) {
      return errorResponse("NOT_FOUND", "No account found with this email", 404, requestId);
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

    return successResponse({ message: "OTP sent to your registered email" }, 200, requestId);
  } catch (error) {
    console.error("FORGOT PASSWORD SEND OTP ERROR:", error);
    const message = error instanceof Error ? error.message : "Server error";
    const emailConfigError = message.includes("Email is not configured");
    const emailSendError = message.includes("Email send failed");
    return errorResponse(
      emailConfigError || emailSendError ? "EMAIL_UNAVAILABLE" : "SERVER_ERROR",
      emailConfigError || emailSendError
        ? "Unable to send OTP email. Configure RESEND_API_KEY and MAIL_FROM in .env.local."
        : "Server error",
      emailConfigError || emailSendError ? 503 : 500,
      requestId,
    );
  }
}
