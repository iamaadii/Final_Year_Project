import crypto from "crypto";
import { successResponse, errorResponse } from "@/lib/api/routeUtils";
import { verifyWhatsAppSignature } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge || "", { status: 200 });
  }

  return errorResponse("FORBIDDEN", "Webhook verification failed", 403, requestId);
}

export async function POST(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const signature = req.headers.get("x-hub-signature-256") || "";
  const raw = await req.text();

  if (!verifyWhatsAppSignature(raw, signature)) {
    return errorResponse("INVALID_SIGNATURE", "Invalid webhook signature", 400, requestId);
  }

  let payload = {};
  try {
    payload = JSON.parse(raw || "{}");
  } catch {
    return errorResponse("INVALID_PAYLOAD", "Malformed webhook payload", 400, requestId);
  }

  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  const hasMessages = entries.some((entry) =>
    Array.isArray(entry?.changes) && entry.changes.some((change) => Array.isArray(change?.value?.messages)),
  );

  return successResponse({ received: true, hasMessages }, 200, requestId);
}
