import { z } from "zod";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";
import { getJobStatus, reminderQueue, erpSyncQueue, ocrQueue, complianceQueue, matchQueue } from "@/lib/workers/queue";

const QueueSchema = z.enum(["reminders", "erp-sync", "ocr", "compliance", "match"]);

export async function GET(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { jobid } = params;
  const queueName = req.nextUrl.searchParams.get("queue") || "reminders";
  const parsed = QueueSchema.safeParse(queueName);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid queue name", 400, auth.requestId);
  }

  const queue = parsed.data === "erp-sync"
    ? erpSyncQueue
    : parsed.data === "ocr"
      ? ocrQueue
      : parsed.data === "compliance"
        ? complianceQueue
        : parsed.data === "match"
          ? matchQueue
          : reminderQueue;
  const job = await getJobStatus(queue, jobid);

  if (!job) {
    return errorResponse("NOT_FOUND", "Job not found", 404, auth.requestId);
  }

  return successResponse(job, 200, auth.requestId);
}
