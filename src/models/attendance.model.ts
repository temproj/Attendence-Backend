// Path: src/models/attendance.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IAttendance extends Document {
  userId: Types.ObjectId;
  date: Date;
  status: "Present";
  semester: number;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Present"],
      default: "Present",
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// One record per user per date
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default model<IAttendance>("Attendance", attendanceSchema);
