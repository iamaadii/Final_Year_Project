import { randomUUID } from "crypto";
import { apiSuccess, apiError } from "@/lib/api/response";
import { connectDB } from "@/lib/db/client";
import { getRedisClient } from "@/lib/cache/redis";

export async function GET() {
  const timestamp = new Date().toISOString();
  let db = "down";
  let redis = "down";

  try {
    await connectDB();
    db = "up";
  } catch {
    db = "down";
  }

  try {
    const client = getRedisClient();
    if (client) {
      const pong = await client.ping();
      redis = pong === "PONG" ? "up" : "down";
    } else {
      redis = "disabled";
    }
  } catch {
    redis = "down";
  }

  const healthy = db === "up" && (redis === "up" || redis === "disabled");
  const payload = { status: healthy ? "ok" : "degraded", db, redis, timestamp };

  if (!healthy) {
    return apiError("HEALTH_CHECK_FAILED", "Service health check failed", payload, 503, {
      requestId: randomUUID(),
    });
  }

  return apiSuccess(payload, { requestId: randomUUID() });
}
