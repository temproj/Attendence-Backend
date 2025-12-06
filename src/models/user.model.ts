// Path: src/models/user.model.ts
import { Schema, model, Document } from "mongoose";

export type UserRole =
  | "STUDENT"
  | "ADMIN"
  | "TEACHER"
  | "HOD"
  | "FEEDBACK"
  | "DEVELOPER";

// Nested encrypted email structure
export interface IEncryptedEmail {
  iv: string;
  encryptedData: string;
}

export interface IUser extends Document {
  name: string;
  email: IEncryptedEmail;      // AES-256: { iv, encryptedData }
  emailMasked: string;         // "23***@gecbanka.org"
  password: string;            // bcrypt hash
  registrationNumber: string;  // 11-digit reg no
  branchCode?: string;         // "103", "104", ...
  semester: number;            // 1..8
  courseStartDate?: Date;
  courseEndDate?: Date;
  role: UserRole;              // primary role
  roles: UserRole[];           // extra roles
  otpHash?: string;
  otpExpiry?: Date;
  otpRequestCount: number;
  otpLastRequestDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const encryptedEmailSchema = new Schema<IEncryptedEmail>(
  {
    iv: { type: String, required: true },
    encryptedData: { type: String, required: true },
  },
  { _id: false } // nested, no own _id
);

const userSchema = new Schema<IUser>(
  {
    // Basic identity
    name: { type: String, required: true },

    // Encrypted email (never plain in DB)
    email: {
      type: encryptedEmailSchema,
      required: true,
    },

    // Masked: "23***@gecbanka.org" – used for lookup safely
    emailMasked: { type: String, required: true, unique: true },

    // Login password (bcrypt hash)
    password: { type: String, required: true },

    // College identity (11-digit reg no)
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{11}$/,
    },

    // Academic info
    branchCode: {
      type: String, // e.g. "103", "104" (EE/ECE etc)
    },
    semester: { type: Number, required: true, min: 1, max: 8 },
    courseStartDate: { type: Date },
    courseEndDate: { type: Date },

    // ===== Roles =====
    role: {
      type: String,
      enum: ["STUDENT", "ADMIN", "TEACHER", "HOD", "FEEDBACK", "DEVELOPER"],
      default: "STUDENT",
    },

    roles: {
      type: [String],
      enum: ["STUDENT", "ADMIN", "TEACHER", "HOD", "FEEDBACK", "DEVELOPER"],
      default: ["STUDENT"],
    },

    // ===== OTP (hashed) =====
    otpHash: { type: String },
    otpExpiry: { type: Date },

    // OTP abuse protection
    otpRequestCount: { type: Number, default: 0 },
    otpLastRequestDate: { type: Date },

    // Soft delete / graduation / block
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<IUser>("User", userSchema);
