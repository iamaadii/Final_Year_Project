import crypto from "crypto";

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v19.0";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET || "";

export function verifyWhatsAppSignature(rawBody, signature) {
  if (!WHATSAPP_APP_SECRET) return true;
  if (!signature || !signature.startsWith("sha256=")) return false;

  const provided = Buffer.from(signature.replace("sha256=", ""), "hex");
  const expected = Buffer.from(
    crypto.createHmac("sha256", WHATSAPP_APP_SECRET).update(rawBody).digest("hex"),
    "hex",
  );

  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}

export async function sendWhatsAppTextMessage({ to, body, previewUrl = false }) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("WhatsApp credentials are not configured");
  }

  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body,
          preview_url: previewUrl,
        },
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = payload?.error?.message || "Failed to send WhatsApp message";
    throw new Error(errorMessage);
  }

  return payload;
}
