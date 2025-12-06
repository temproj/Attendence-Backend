// Path: src/validators/user.validator.ts
import { z } from "zod";

// 11 digit reg no
export const regNoSchema = z
  .string()
  .regex(/^\d{11}$/, "Registration number must be 11 digits");

// Password 8–128
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

// Login schema
export const loginUserSchema = z.object({
  registrationNumber: regNoSchema,
  password: passwordSchema,
});

// email: 11-digit-regno@gecbanka.org
export const gecEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^\d{11}@gecbanka\.org$/, "Email must be like 23104134010@gecbanka.org");

// Forgot password body
export const forgotPasswordSchema = z.object({
  email: gecEmailSchema,
});

// Reset password body
export const resetPasswordSchema = z.object({
  email: gecEmailSchema,
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
  newPassword: passwordSchema,
});

// Post-login OTP verify
export const verifyPostLoginOtpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

// Types (optional but handy)
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyPostLoginOtpInput = z.infer<typeof verifyPostLoginOtpSchema>;
