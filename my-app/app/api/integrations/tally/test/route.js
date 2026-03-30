import User from "@/models/User";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";

async function testTallyConnection(host, port) {
  const resolvedHost = String(host || "").trim();
  const resolvedPort = Number(port || 9000);

  if (!resolvedHost) {
    return { ok: false, message: "Tally host is not configured." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const url = `http://${resolvedHost}:${Number.isFinite(resolvedPort) ? resolvedPort : 9000}`;

  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    if (!res.ok) {
      return { ok: false, message: `Tally endpoint responded with status ${res.status}.` };
    }
    return { ok: true, message: "Tally connection successful." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to reach Tally endpoint." };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const user = await User.findById(auth.user._id).lean();
  if (!user) {
    return errorResponse("NOT_FOUND", "User not found", 404, auth.requestId);
  }

  const result = await testTallyConnection(user?.tallyConfig?.host, user?.tallyConfig?.port);
  if (!result.ok) {
    return errorResponse("INTEGRATION_ERROR", result.message, 502, auth.requestId);
  }

  return successResponse({ message: result.message }, 200, auth.requestId);
}
