import { z } from "zod";
import TreasuryConfig from "@/models/TreasuryConfig";
import {
  requireAuth,
  parseBody,
  successResponse,
  errorResponse,
  writeAudit,
} from "@/lib/api/routeUtils";

const TreasuryConfigSchema = z.object({
  poolCr: z.number().min(0).max(1000),
  targetApr: z.number().min(0).max(50),
  paused: z.boolean().optional(),
});

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const config = await TreasuryConfig.findOne({ companyId: auth.companyId }).lean();

  return successResponse(
    {
      poolCr: Number(config?.poolCr || 0),
      targetApr: Number(config?.targetApr || 0),
      paused: Boolean(config?.paused || false),
    },
    200,
    auth.requestId,
  );
}

export async function PATCH(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(req, TreasuryConfigSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const updateSet = {
    poolCr: Number(parsed.data.poolCr || 0),
    targetApr: Number(parsed.data.targetApr || 0),
  };
  if (typeof parsed.data.paused === "boolean") {
    updateSet.paused = parsed.data.paused;
  }

  const updated = await TreasuryConfig.findOneAndUpdate(
    { companyId: auth.companyId },
    {
      $set: updateSet,
    },
    { upsert: true, new: true },
  ).lean();

  if (!updated) {
    return errorResponse("SERVER_ERROR", "Failed to update treasury config", 500, auth.requestId);
  }

  await writeAudit({
    user: auth.user,
    companyId: auth.companyId,
    action: "treasury_config_updated",
    resource: "TreasuryConfig",
    resourceId: String(updated._id),
    details: {
      poolCr: updated.poolCr,
      targetApr: updated.targetApr,
      paused: updated.paused,
    },
    req,
  });

  return successResponse(
    {
      poolCr: Number(updated.poolCr || 0),
      targetApr: Number(updated.targetApr || 0),
      paused: Boolean(updated.paused || false),
    },
    200,
    auth.requestId,
  );
}
