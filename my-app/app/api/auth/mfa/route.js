import { z } from "zod";
import { setupMFA, verifyMFA } from "@/lib/auth-node";
import { logAudit } from "@/lib/audit";
import { requireAuth, parseBody, successResponse, errorResponse } from "@/lib/api/routeUtils";

const MfaVerifySchema = z.object({
  token: z.string().min(1),
  secret: z.string().min(1),
});

/**
 * GET: Setup MFA (returns QR code)
 */
export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const { secret, qrCodeUrl } = await setupMFA(user.email);
  
  // We don't save the secret yet — only after verification
  return successResponse({ qrCodeUrl, secret }, 200, auth.requestId);
}

/**
 * POST: Verify and Enable MFA
 */
export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const parsed = await parseBody(req, MfaVerifySchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  try {
    const isValid = verifyMFA(parsed.data.token, parsed.data.secret);
    if (!isValid) {
      return errorResponse("VALIDATION_ERROR", "Invalid verification code", 400, auth.requestId);
    }

    user.mfaSecret = parsed.data.secret; // Will be encrypted by User model pre-save hook
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

    return successResponse({ message: "MFA enabled successfully" }, 200, auth.requestId);
  } catch {
    return errorResponse("SERVER_ERROR", "Server error", 500, auth.requestId);
  }
}
