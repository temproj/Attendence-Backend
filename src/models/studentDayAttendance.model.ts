// Path: src/models/studentDayAttendance.model.ts
import { Schema, model, Document, Types } from "mongoose";

export type AttendanceUploadType = "WEEKLY" | "MONTHLY" | "YEARLY" | "MANUAL";

export interface IStudentDayAttendance extends Document {
  regNo: string;                 // 11-digit
  date: string;                  // "YYYY-MM-DD"
  present: boolean;              // true = came at least once
  lastUploadId?: Types.ObjectId; // which file last touched this
  lastUploadType: AttendanceUploadType;
  createdAt: Date;
  updatedAt: Date;
}

const studentDayAttendanceSchema = new Schema<IStudentDayAttendance>(
  {
    regNo: {
      type: String,
      required: true,
      minlength: 11,
      maxlength: 11,
      index: true,
    },

    // Sirf date part – no time
    date: {
      type: String,
      required: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    // Biometric se mila toh always true
    present: {
      type: Boolean,
      default: true,
    },

    // Kis upload se last baar update hua
    lastUploadId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceUpload",
    },

    lastUploadType: {
      type: String,
      enum: ["WEEKLY", "MONTHLY", "YEARLY", "MANUAL"],
      default: "WEEKLY",
    },
  },
  { timestamps: true }
);

// (regNo, date) unique – ek din ka ek hi record
studentDayAttendanceSchema.index({ regNo: 1, date: 1 }, { unique: true });

export default model<IStudentDayAttendance>(
  "StudentDayAttendance",
  studentDayAttendanceSchema
);
