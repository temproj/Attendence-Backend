// Path: src/models/attendanceConflict.model.ts
import { Schema, model, Document, Types } from "mongoose";
import { AttendanceUploadType } from "./studentDayAttendance.model";

export interface IAttendanceConflict extends Document {
  regNo: string;
  date: string;
  missingInUploadId: Types.ObjectId;
  fixedByUploadId: Types.ObjectId;
  fixedByType: AttendanceUploadType;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceConflictSchema = new Schema<IAttendanceConflict>(
  {
    regNo: {
      type: String,
      required: true,
      minlength: 11,
      maxlength: 11,
      index: true,
    },

    date: {
      type: String,
      required: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    // Purana upload jisme ye din missing tha
    missingInUploadId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceUpload",
      required: true,
    },

    // Naya upload jisse ye present ho gaya
    fixedByUploadId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceUpload",
      required: true,
    },

    fixedByType: {
      type: String,
      enum: ["WEEKLY", "MONTHLY", "YEARLY", "MANUAL"],
      required: true,
    },

    // Optional note for admin
    note: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Same conflict dobara log na ho
attendanceConflictSchema.index(
  { regNo: 1, date: 1, missingInUploadId: 1, fixedByUploadId: 1 },
  { unique: true }
);

export default model<IAttendanceConflict>(
  "AttendanceConflict",
  attendanceConflictSchema
);
