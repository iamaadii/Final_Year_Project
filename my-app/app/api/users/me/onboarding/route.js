import { z } from "zod";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { requireAuth, parseBody, successResponse, errorResponse, writeAudit } from "@/lib/api/routeUtils";

const OnboardingSchema = z.object({
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  udhyamNumber: z.string().optional(),
  billingAddress: z.string().optional(),
  contactNumber: z.string().optional(),
});

export async function PUT(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(req, OnboardingSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  try {
    const { companyName, gstNumber, panNumber, udhyamNumber, billingAddress, contactNumber } = parsed.data;
    const user = auth.user;

    user.companyName = companyName || user.companyName;
    user.udhyamNumber = udhyamNumber;
    
    // User model pre-save hook encrypts gstNumber/panNumber.
    if (gstNumber) user.gstNumber = gstNumber;
    if (panNumber) user.panNumber = panNumber;

    if (!user.settings) user.settings = {};
    user.settings.billingAddress = billingAddress;
    if (contactNumber) user.contactNumber = contactNumber;
    user.hasCompletedOnboarding = true;
    user.isVerified = true;

    await user.save();

    await writeAudit({
      user: auth.user,
      companyId: auth.companyId,
      action: "onboarding_completed",
      resource: "User",
      resourceId: user._id,
      details: { companyName: user.companyName },
      req,
    });

    const sessionPayload = {
      userId: user._id.toString(),
      tenantId: user.companyId?.toString() || "",
      role: user.role || "view_only",
      userType: user.userType,
      hasCompletedOnboarding: true,
    };

    const accessToken = await signAccessToken(sessionPayload);
    const refreshToken = await signRefreshToken(sessionPayload);

    user.refreshToken = refreshToken;
    await user.save();

    const response = successResponse({ message: "Onboarding complete" }, 200, auth.requestId);

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    const err = error && typeof error === "object" ? error : null;
    return errorResponse("SERVER_ERROR", err?.message || "Server error", 500, auth.requestId);
  }
}

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const user = auth.user;
  const decrypted = typeof user.getDecryptedData === "function" ? user.getDecryptedData() : {};

  return successResponse(
    {
      hasCompletedOnboarding: Boolean(user.hasCompletedOnboarding),
      userType: user.userType,
      companyName: String(user.companyName || ""),
      gstNumber: String(decrypted?.gstNumber || ""),
      panNumber: String(decrypted?.panNumber || ""),
      udhyamNumber: String(user.udhyamNumber || ""),
      billingAddress: String(user?.settings?.billingAddress || ""),
      contactNumber: String(user.contactNumber || ""),
    },
    200,
    auth.requestId,
  );
}
