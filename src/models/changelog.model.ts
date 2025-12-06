// Path: src/models/changelog.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IChangelog extends Document {
  adminId: Types.ObjectId;
  fileName: string;
  associatedRecords: Types.ObjectId[]; // Attendance._id[]
  createdAt: Date;
  updatedAt: Date;
}

const changelogSchema = new Schema<IChangelog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    // Attendance records created in this upload
    associatedRecords: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attendance",
      },
    ],
  },
  { timestamps: true }
);

export default model<IChangelog>("Changelog", changelogSchema);
