import { NextResponse } from "next/server";
import { getAuthUserFromCookies } from "@/lib/auth";
import { setupMFA, verifyMFA } from "@/lib/auth-node";
import { logAudit } from "@/lib/audit";

/**
 * GET: Setup MFA (returns QR code)
 */
export async function GET(req) {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { secret, qrCodeUrl } = await setupMFA(user.email);
  
  // We don't save the secret yet — only after verification
  return NextResponse.json({ qrCodeUrl, secret });
}

/**
 * POST: Verify and Enable MFA
 */
export async function POST(req) {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { token, secret } = await req.json();
    
    const isValid = verifyMFA(token, secret);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid verification code" }, { status: 400 });
    }

    user.mfaSecret = secret; // Will be encrypted by User model pre-save hook
    user.mfaEnabled = true;
    await user.save();

    await logAudit({
      userId: user._id,
      userName: user.name,
      companyId: user.companyId,
      action: "mfa_enabled",
      resource: "User",
      resourceId: user._id,
      req
    });

    return NextResponse.json({ success: true, message: "MFA enabled successfully" });
  } catch (err) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
