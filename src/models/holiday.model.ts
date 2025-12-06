// Path: src/models/holiday.model.ts
import { Schema, model, Document } from "mongoose";

export interface IHoliday extends Document {
  date: Date;          // exact date
  description: string; // "Republic Day" etc.
  createdAt: Date;
  updatedAt: Date;
}

const holidaySchema = new Schema<IHoliday>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 }, { unique: true });

export default model<IHoliday>("Holiday", holidaySchema);
