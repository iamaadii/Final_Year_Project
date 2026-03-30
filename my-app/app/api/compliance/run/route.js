import crypto from "crypto";
import { successResponse, errorResponse } from "@/lib/api/routeUtils";
import { addJob, complianceQueue } from "@/lib/workers/queue";

function isAuthorizedBySecret(req) {
  const configured = process.env.COMPLIANCE_CRON_SECRET;
  if (!configured) return false;
  const provided = req.headers.get("x-compliance-secret");
  return !!provided && provided === configured;
}

export async function POST(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  if (!isAuthorizedBySecret(req)) {
    return errorResponse(
      "UNAUTHORIZED",
      "Unauthorized compliance runner. Provide x-compliance-secret.",
      401,
      requestId,
    );
  }

  const queuedJob = await addJob(
    complianceQueue,
    {
      requestId,
      trigger: "scheduled",
    },
    {
      jobId: `compliance:${new Date().toISOString().slice(0, 13)}`,
    },
    "run-compliance",
  );

  return successResponse({ jobId: queuedJob?.id || null }, 200, requestId);
}
