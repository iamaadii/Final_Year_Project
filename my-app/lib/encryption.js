import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.PII_ENCRYPTION_KEY; // Must be 32 bytes (256 bits)
const IV_LENGTH = 16;

/**
 * Encrypts PII data (GSTIN, PAN, Bank Account) using AES-256-GCM.
 * @param {string} text - The raw data to encrypt.
 * @returns {string} - Combined IV, Auth Tag, and Ciphertext in base64.
 */
export function encryptPII(text) {
  if (!text) return "";
  if (!ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PII_ENCRYPTION_KEY is not set in production!");
    }
    return text; // Fallback for dev if key missing
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    // Format: iv:authTag:encrypted
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("Critical Failure: PII Encryption failed:", err.message);
    if (process.env.NODE_ENV === "production") {
      throw new Error("Encryption failed - check PII_ENCRYPTION_KEY configuration");
    }
    return text; // Safe fallback in non-prod
  }
}

/**
 * Decrypts PII data.
 * @param {string} cipherText - Combined IV, Auth Tag, and Ciphertext.
 * @returns {string} - The raw decrypted text.
 */
export function decryptPII(cipherText) {
  if (!cipherText || !cipherText.includes(":")) return cipherText;
  if (!ENCRYPTION_KEY) return cipherText;

  try {
    const [ivHex, authTagHex, encryptedHex] = cipherText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err) {
    console.error("PII Decryption Failed:", err.message);
    return "[DECRYPTION_ERROR]";
  }
}
