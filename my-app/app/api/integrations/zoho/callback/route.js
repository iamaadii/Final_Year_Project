import User from "@/models/User";
import { requireAuth, successResponse, errorResponse, writeAudit } from "@/lib/api/routeUtils";

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const code = req.nextUrl.searchParams.get("code");
  const orgId = req.nextUrl.searchParams.get("org_id") || "";

  if (!code) {
    return errorResponse("VALIDATION_ERROR", "Missing OAuth code", 400, auth.requestId);
  }

  // Placeholder for OAuth token exchange with Zoho.
  await User.findByIdAndUpdate(auth.user._id, {
    $set: {
      "zohoBooksConfig.orgId": orgId,
      "zohoBooksConfig.accessToken": `oauth-code:${code}`,
      "zohoBooksConfig.syncEnabled": true,
    },
  });

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "zoho_oauth_callback_received",
    resource: "Integration",
    resourceId: String(auth.user._id),
    details: { orgId, codePreview: code.slice(0, 6) },
    req,
  });

  return successResponse({ connected: true, provider: "zoho-books", orgId }, 200, auth.requestId);
}
