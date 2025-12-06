// Path: src/controllers/attendance.controller.ts
import { Request, Response } from "express";
import User from "../models/user.model";
import StudentDayAttendance from "../models/studentDayAttendance.model";
import AttendanceUpload from "../models/attendanceUpload.model";
import AttendanceConflict from "../models/attendanceConflict.model";
import parseBiometricFile from "../utils/biometricFileParser";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    roles?: string[];
  };
}

// ---- extra content sanity check – binary / junk guard ----
const isSafeText = (buffer: Buffer): boolean => {
  const text = buffer.toString("utf8");

  // 1) null bytes -> likely binary
  if (text.includes("\u0000")) return false;

  // 2) Allow printable + newline/tab only
  const bad = /[^\x09\x0A\x0D\x20-\x7E]/; // tab, LF, CR, space-tilde
  // Biometric logs generally: digits, -, :, space, CRLF
  if (bad.test(text)) {
    // some unusual binary-ish chars found
    return false;
  }

  // 3) Must contain at least some digits + dates pattern
  if (!/\d{4}-\d{2}-\d{2}/.test(text)) return false;

  return true;
};

// --- Upload biometric attendance (weekly/monthly/yearly) ---
export const uploadBiometricAttendance = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // 1) File basic validation (upload.middleware ne bhi check kia hai)
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const originalName = req.file.originalname || "";
    const mime = (req.file.mimetype || "").toLowerCase();

    // Extension guard – sirf .dat / .txt
    if (!/\.(dat|txt)$/i.test(originalName)) {
      return res.status(400).json({
        message: "Only .dat or .txt biometric text files are allowed.",
      });
    }

    // Mimetype guard – best-effort
    if (
      mime &&
      !["text/plain", "application/octet-stream"].includes(mime)
    ) {
      return res.status(400).json({
        message: "Invalid file type. Only plain text biometric logs allowed.",
      });
    }

    // 2) Extra binary/junk check
    if (!isSafeText(req.file.buffer)) {
      return res.status(400).json({
        message:
          "Invalid biometric file content. Only plain text attendance logs are allowed.",
      });
    }

    // 3) Basic meta from body
    const { uploadType } = req.body as { uploadType?: string }; // e.g. "WEEKLY", "MONTHLY"
    const createdBy = req.user?.id;

    // 4) Parse file (NO DB inside parser)
    const { records, summary } = parseBiometricFile(req.file.buffer);

    if (!records.length) {
      return res.status(400).json({
        message: "No valid attendance records found in file.",
        summary,
      });
    }

    // 5) Create upload metadata (log)
    const uploadDoc = await AttendanceUpload.create({
      type: uploadType || "BIOMETRIC",
      fileName: originalName,
      // summary from parser (fields are optional in model)
      totalLines: summary.totalLines,
      parsedLines: summary.parsedLines,
      invalidLines: summary.invalidLines,
      fromDate: summary.fromDate,
      toDate: summary.toDate,
      createdBy,
    });

    // 6) Collect unique regNos & dates from parsed records
    const regNoSet = new Set<string>();
    const dateSet = new Set<string>();

    for (const r of records) {
      regNoSet.add(r.regNo);
      dateSet.add(r.date);
    }

    const regNos = Array.from(regNoSet);
    const dates = Array.from(dateSet);

    // 7) Load users for these regNos (single DB query)
    const users = await User.find({
      registrationNumber: { $in: regNos },
      isActive: true,
    }).select("_id registrationNumber");

    const regNoToUserId = new Map<string, string>();
    for (const u of users) {
      regNoToUserId.set(u.registrationNumber, u._id.toString());
    }

    // Unknown regNos (no matching user in system)
    const unknownRegNos = regNos.filter((r) => !regNoToUserId.has(r));

    // 8) Existing attendance for these regNo+date combos
    const existing = await StudentDayAttendance.find({
      regNo: { $in: regNos },
      date: { $in: dates },
    }).select("regNo date lastUploadId");

    const existingKeys = new Map<string, string | null>(); // "regNo|date" -> lastUploadId
    for (const e of existing) {
      existingKeys.set(
        `${e.regNo}|${e.date}`,
        e.lastUploadId ? e.lastUploadId.toString() : null
      );
    }

    const bulkOps: any[] = [];
    const conflictDocs: any[] = [];

    // 9) Build bulk upserts + conflict docs
    for (const r of records) {
      const userId = regNoToUserId.get(r.regNo);
      if (!userId) continue; // skip unknown regNo

      const key = `${r.regNo}|${r.date}`;
      const prevUploadId = existingKeys.get(key);

      // Conflict: same regNo+date already present from another upload
      if (prevUploadId && prevUploadId !== uploadDoc._id.toString()) {
        conflictDocs.push({
          regNo: r.regNo,
          date: r.date,
          previousUploadId: prevUploadId,
          newUploadId: uploadDoc._id,
          resolved: false,
        });
        // latest upload still overwrite karega (policy: latest wins)
      }

      // Upsert one doc per (regNo, date)
      bulkOps.push({
        updateOne: {
          filter: { regNo: r.regNo, date: r.date },
          update: {
            $set: {
              regNo: r.regNo,
              date: r.date,
              present: true,
              lastUploadId: uploadDoc._id,
              lastUploadType: uploadType || "BIOMETRIC",
            },
          },
          upsert: true,
        },
      });
    }

    // 10) Apply bulk writes
    if (bulkOps.length) {
      await StudentDayAttendance.bulkWrite(bulkOps, { ordered: false });
    }

    // 11) Save conflicts (if any)
    if (conflictDocs.length) {
      await AttendanceConflict.insertMany(conflictDocs);
    }

    // 12) Final response
    return res.status(201).json({
      message: "Biometric attendance uploaded successfully.",
      summary: {
        ...summary,
        uploadId: uploadDoc._id,
        totalUsersMatched: users.length,
        unknownRegNosCount: unknownRegNos.length,
        unknownRegNos,
        conflicts: conflictDocs.length,
      },
    });
  } catch (error: any) {
    console.error("uploadBiometricAttendance error:", error);
    return res.status(500).json({
      message: "Internal server error while processing biometric file.",
      error: error.message,
    });
  }
};
