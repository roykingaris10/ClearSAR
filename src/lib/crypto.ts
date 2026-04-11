import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// AES-256-GCM encryption for tokens at rest.
// Derives a key from SESSION_SECRET so all data is bound to deployment secrets.

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const SALT = "clearsar-token-salt-v1";

function getKey(): Buffer {
  const secret =
    process.env.SESSION_SECRET ??
    "dev-only-secret-please-change-me-to-a-long-random-string";
  return scryptSync(secret, SALT, 32);
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptToken(payload: string): string {
  const key = getKey();
  const data = Buffer.from(payload, "base64");
  const iv = data.subarray(0, IV_LEN);
  const tag = data.subarray(IV_LEN, IV_LEN + 16);
  const encrypted = data.subarray(IV_LEN + 16);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
