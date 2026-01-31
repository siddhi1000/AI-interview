import crypto from "crypto";
import { HttpError } from "./httpError";

const keyB64 = process.env.FIELD_ENCRYPTION_KEY;
const key = keyB64 ? Buffer.from(keyB64, "base64") : null;

if (!key || key.length !== 32) {
  throw new Error("FIELD_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
}

export const encryptString = (plaintext: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
};

export const decryptString = (ciphertextB64: string) => {
  try {
    const raw = Buffer.from(ciphertextB64, "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch {
    throw new HttpError(400, "Invalid encrypted value.");
  }
};

