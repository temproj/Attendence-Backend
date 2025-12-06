// Path: src/middlewares/upload.middleware.ts
import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

// Memory storage because Vercel/serverless (no disk writes)
const storage = multer.memoryStorage();

// ✅ Only allow biometric .dat/.txt files
const ALLOWED_EXTENSIONS = [".dat", ".txt"]; // sirf .dat chaiye to .txt hata dena

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  try {
    const ext = path.extname(file.originalname || "").toLowerCase();

    // 1) Check extension
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(
        new Error("Only .dat or .txt biometric text files are allowed.")
      );
    }

    // 2) Check mimetype (best-effort)
    const allowedMime = [
      "text/plain",
      "application/octet-stream", // kaafi biometric devices ye dete hain
    ];

    if (file.mimetype && !allowedMime.includes(file.mimetype)) {
      return cb(
        new Error("Invalid file type. Only plain text biometric logs allowed.")
      );
    }

    cb(null, true);
  } catch (_err) {
    cb(new Error("File validation failed."));
  }
};

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

// ✅ Export specialized uploader for biometric logs
export const biometricUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter,
});

export default biometricUpload;
