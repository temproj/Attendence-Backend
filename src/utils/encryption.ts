// Path: src/utils/encryption.ts
import crypto from "crypto";

// Ensure your ENCRYPTION_SECRET_KEY in .env is a 64-character hex string (32 bytes)
const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_SECRET_KEY!, "hex");

export interface EncryptedBlob {
  iv: string;
  encryptedData: string;
}

export const encrypt = (text: string): EncryptedBlob => {
  const iv = crypto.randomBytes(16); // Generate a new random Initialization Vector
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted,
  };
};

export const decrypt = (hash: EncryptedBlob): string => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    SECRET_KEY,
    Buffer.from(hash.iv, "hex")
  );
  let decrypted = decipher.update(hash.encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
