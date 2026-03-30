import { z } from "zod";
import { requireAuth, parseBody, successResponse, errorResponse, writeAudit } from "@/lib/api/routeUtils";

const OnboardingSchema = z.object({
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  udhyamNumber: z.string().optional(),
  billingAddress: z.string().optional(),
});

export async function PUT(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(req, OnboardingSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  try {
    const { companyName, gstNumber, panNumber, udhyamNumber, billingAddress } = parsed.data;
    const user = auth.user;

    user.companyName = companyName || user.companyName;
    user.udhyamNumber = udhyamNumber;
    
    // User model pre-save hook encrypts gstNumber/panNumber.
    if (gstNumber) user.gstNumber = gstNumber;
    if (panNumber) user.panNumber = panNumber;

    if (!user.settings) user.settings = {};
    user.settings.billingAddress = billingAddress;
    user.hasCompletedOnboarding = true;

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

    return successResponse({ message: "Onboarding complete" }, 200, auth.requestId);
  } catch (error) {
    const err = error && typeof error === "object" ? error : null;
    return errorResponse("SERVER_ERROR", err?.message || "Server error", 500, auth.requestId);
  }
}
