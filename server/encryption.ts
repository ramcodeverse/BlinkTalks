import crypto from "crypto";

// Fallback key derived from a static string, strictly for zero-config local development.
// Real production deployments will supply ENCRYPTION_KEY in environment variables.
const FALLBACK_SECRET = "telegram_portfolio_aes_fallback_secret_369";

let encryptionKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (!encryptionKey) {
    const rawKey = process.env.ENCRYPTION_KEY || FALLBACK_SECRET;
    if (!process.env.ENCRYPTION_KEY) {
      console.warn(
        "⚠️ WARNING: ENCRYPTION_KEY env var is missing. Using static fallback secret. This is INSECURE for production."
      );
    }
    // Hash key with SHA-256 to ensure it is exactly 32 bytes (256 bits) for AES-256
    encryptionKey = crypto.createHash("sha256").update(rawKey).digest();
  }
  return encryptionKey;
}

/**
 * Encrypts a string of plain text using AES-256-GCM.
 * Output format is `iv_hex:tag_hex:ciphertext_hex`
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // 12 bytes / 96-bit IV is standard for GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const tag = cipher.getAuthTag().toString("hex");
    
    return `${iv.toString("hex")}:${tag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt message content");
  }
}

/**
 * Decrypts an AES-256-GCM encrypted string formatted as `iv_hex:tag_hex:ciphertext_hex`
 */
export function decrypt(encryptedText: string): string {
  try {
    // If it doesn't match the format (e.g. unencrypted seed data or malformed), return as is
    if (!encryptedText || !encryptedText.includes(":")) {
      return encryptedText;
    }

    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      return encryptedText; // Graceful fallback for non-encrypted or legacy strings
    }

    const [ivHex, tagHex, ciphertextHex] = parts;
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivHex, "hex")
    );
    
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    
    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return "[Encrypted Message - Decryption Failed]";
  }
}
