import crypto from "crypto";

function resolveSecretMaterial() {
  const value =
    process.env.BANK_ACCOUNT_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    process.env.MONGODB_URI ||
    "";

  if (!value) {
    throw new Error("Missing bank account encryption secret.");
  }

  return crypto.createHash("sha256").update(value).digest();
}

export function encryptBankAccountNumber(value) {
  const plain = String(value || "").trim();
  if (!plain) return "";

  const key = resolveSecretMaterial();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}
