import { z } from "zod";
import User from "@/models/User";
import {
  requireAuth,
  parseBody,
  successResponse,
  writeAudit,
} from "@/lib/api/routeUtils";

const ConsentSchema = z.object({
  consentVersion: z.string().min(1),
  purposes: z.array(
    z.object({
      purpose: z.string().min(1),
      granted: z.boolean(),
    }),
  ).min(1),
});

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const user = await User.findById(auth.user._id).lean();
  return successResponse({
    consentVersion: user?.dpdpConsentVersion || null,
    consentTimestamp: user?.dpdpConsentTimestamp || null,
    purposes: user?.dpdpConsentPurposes || [],
    dataRetentionExpiresAt: user?.dataRetentionExpiresAt ? new Date(user.dataRetentionExpiresAt).toISOString() : null,
    deletionRequestedAt: user?.deletionRequestedAt ? new Date(user.deletionRequestedAt).toISOString() : null,
    deletionScheduledAt: user?.deletionScheduledAt ? new Date(user.deletionScheduledAt).toISOString() : null,
  }, 200, auth.requestId);
}

export async function PATCH(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(req, ConsentSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const now = new Date();
  const purposes = parsed.data.purposes.map((p) => ({
    purpose: p.purpose,
    granted: p.granted,
    timestamp: now,
  }));

  const user = await User.findByIdAndUpdate(
    auth.user._id,
    {
      $set: {
        dpdpConsentVersion: parsed.data.consentVersion,
        dpdpConsentTimestamp: now,
        dpdpConsentPurposes: purposes,
      },
    },
    { new: true },
  ).lean();

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "dpdp_consent_updated",
    resource: "User",
    resourceId: auth.user._id,
    details: {
      consentVersion: parsed.data.consentVersion,
      grantedCount: purposes.filter((p) => p.granted).length,
    },
    req,
  });

  return successResponse({
    consentVersion: user?.dpdpConsentVersion || null,
    consentTimestamp: user?.dpdpConsentTimestamp || null,
    purposes: user?.dpdpConsentPurposes || [],
    dataRetentionExpiresAt: user?.dataRetentionExpiresAt ? new Date(user.dataRetentionExpiresAt).toISOString() : null,
    deletionRequestedAt: user?.deletionRequestedAt ? new Date(user.deletionRequestedAt).toISOString() : null,
    deletionScheduledAt: user?.deletionScheduledAt ? new Date(user.deletionScheduledAt).toISOString() : null,
  }, 200, auth.requestId);
}
