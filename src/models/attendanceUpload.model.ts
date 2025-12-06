// Path: src/models/attendanceUpload.model.ts
import { Schema, model, Document, Types } from "mongoose";
import { AttendanceUploadType } from "./studentDayAttendance.model";

export interface IAttendanceUpload extends Document {
  type: AttendanceUploadType; // WEEKLY/MONTHLY/YEARLY/MANUAL
  fileName: string;
  fromDate: string;           // "YYYY-MM-DD"
  toDate: string;             // "YYYY-MM-DD"
  createdBy: Types.ObjectId;  // admin/dev
  createdAt: Date;
  updatedAt: Date;
}

const attendanceUploadSchema = new Schema<IAttendanceUpload>(
  {
    type: {
      type: String,
      enum: ["WEEKLY", "MONTHLY", "YEARLY", "MANUAL"],
      default: "WEEKLY",
    },

    fileName: { type: String, required: true },

    // File ke andar min/max date
    fromDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    toDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Overlap find / filtering fast
attendanceUploadSchema.index({ fromDate: 1, toDate: 1 });

export default model<IAttendanceUpload>(
  "AttendanceUpload",
  attendanceUploadSchema
);
