// Path: src/controllers/user.controller.ts
import { Request, Response } from "express";
import crypto from "crypto";
import User from "../models/user.model";
import { hashPassword, comparePasswords } from "../utils/passwordHashing";
import { encrypt, decrypt } from "../utils/encryption";
import generateAccessToken from "../utils/generateAccessToken";
import generateRefreshToken from "../utils/generateRefreshToken";
import sendEmail from "../utils/sendEmail";
import { otpEmailTemplate } from "../utils/otpEmailTemplate";
import { forgotPasswordEmailTemplate } from "../utils/forgotPasswordEmailTemplate";
import { resetPasswordConfirmationTemplate } from "../utils/resetPasswordConfirmationTemplate";
import {
  isAllowedCollegeEmail,
} from "../utils/emailDomainCheck";
import {
  loginUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyPostLoginOtpSchema,
} from "../validators/user.validator";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    roles?: string[];
  };
}

// --- helper: mask email in same way everywhere ---
const maskEmail = (email: string): string => {
  const trimmed = email.trim();
  return `${trimmed.substring(0, 2)}***${trimmed.substring(
    trimmed.indexOf("@")
  )}`;
};

// --- OTP config from env ---
const OTP_MAX_PER_DAY = parseInt(process.env.OTP_MAX_PER_DAY || "3", 10);
const OTP_EXPIRE_MINUTES = parseInt(
  process.env.OTP_EXPIRE_MINUTES || "10",
  10
);

// --- helper: OTP request limit (max N per day) ---
const canSendOtp = (user: any): boolean => {
  if (!OTP_MAX_PER_DAY || OTP_MAX_PER_DAY <= 0) return true; // safety

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10); // "YYYY-MM-DD"

  if (!user.otpLastRequestDate) return true;

  const lastKey = user.otpLastRequestDate.toISOString().slice(0, 10);
  if (lastKey !== todayKey) {
    // new day -> reset allowed
    user.otpRequestCount = 0;
    return true;
  }

  return (user.otpRequestCount || 0) < OTP_MAX_PER_DAY;
};

const registerOtpSend = (user: any) => {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  if (!user.otpLastRequestDate) {
    user.otpRequestCount = 1;
    user.otpLastRequestDate = now;
    return;
  }

  const lastKey = user.otpLastRequestDate.toISOString().slice(0, 10);
  if (lastKey !== todayKey) {
    user.otpRequestCount = 1;
    user.otpLastRequestDate = now;
  } else {
    user.otpRequestCount = (user.otpRequestCount || 0) + 1;
  }
};

// ======================
//  LOGIN / LOGOUT
// ======================

export const loginUserController = async (req: Request, res: Response) => {
  try {
    const parsed = loginUserSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || "Invalid input.";
      return res.status(400).json({ message: msg });
    }
    const { registrationNumber, password } = parsed.data;

    // 1) Find user by regNo
    const user = await User.findOne({ registrationNumber });
    if (!user || !user.isActive) {
      return res.status(404).json({
        message: "User not found with this registration number.",
      });
    }

    // 2) Password check
    const isPasswordMatch = await comparePasswords(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // 3) Generate tokens
    const accessToken = generateAccessToken(
      user._id.toString(),
      user.role
    );
    const refreshToken = generateRefreshToken(user._id.toString());

    // 4) Decide cookie names based on role group (STUDENT vs STAFF)
    const isStaff = user.role !== "STUDENT";

    const accessCookieName = isStaff
      ? process.env.COOKIE_STAFF_ACCESS || "staffAccessToken"
      : process.env.COOKIE_STUDENT_ACCESS || "studentAccessToken";

    const refreshCookieName = isStaff
      ? process.env.COOKIE_STAFF_REFRESH || "staffRefreshToken"
      : process.env.COOKIE_STUDENT_REFRESH || "studentRefreshToken";

    const cookieSecure =
      (process.env.COOKIE_SECURE || "true").toLowerCase() === "true";
    const cookieSameSite = (process.env.COOKIE_SAME_SITE as
      | "Lax"
      | "Strict"
      | "None"
      | undefined) || "Lax";

    // 5) Set cookies
    const accessCookieOptions = {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
    } as const;

    const refreshCookieOptions = {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "Strict" as const, // refresh token extra strict
    };

    res.cookie(accessCookieName, accessToken, accessCookieOptions);
    res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);

    // 6) Response
    return res.status(200).json({
      message: "Login successful.",
      success: true,
      data: {
        accessToken,
        refreshToken,
        role: user.role,
        roles: user.roles,
        name: user.name,
        registrationNumber: user.registrationNumber,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const logoutUserController = (req: Request, res: Response) => {
  try {
    // Clear all possible cookies
    const cookiesToClear = [
      process.env.COOKIE_STUDENT_ACCESS || "studentAccessToken",
      process.env.COOKIE_STAFF_ACCESS || "staffAccessToken",
      process.env.COOKIE_STUDENT_REFRESH || "studentRefreshToken",
      process.env.COOKIE_STAFF_REFRESH || "staffRefreshToken",
    ];

    cookiesToClear.forEach((name) => {
      res.clearCookie(name);
    });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error: any) {
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// ======================
//  POST-LOGIN OTP (extra step)
// ======================

export const generateOtpController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: user context missing." });
    }

    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      return res.status(404).json({ message: "User not found." });
    }

    // per-day limit
    if (!canSendOtp(user)) {
      return res.status(429).json({
        message:
          "OTP request limit reached for today. Please try again tomorrow.",
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await hashPassword(otp);
    const otpExpiry = new Date(
      Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000
    );

    user.otpHash = hashedOtp;
    user.otpExpiry = otpExpiry;
    registerOtpSend(user);
    await user.save();

    const userEmail = decrypt(user.email);
    await sendEmail({
      to: userEmail,
      subject: "Your Verification Code",
      html: otpEmailTemplate({ name: user.name, otp }),
    });

    return res.status(200).json({
      message: "OTP has been sent to your registered email address.",
    });
  } catch (error: any) {
    console.error("Generate OTP error:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const verifyOtpController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const parsed = verifyPostLoginOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || "Invalid input.";
      return res.status(400).json({ message: msg });
    }
    const { otp } = parsed.data;

    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: user context missing." });
    }

    const user = await User.findById(userId);

    if (!user || !user.otpHash || user.otpExpiry < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP is invalid or has expired." });
    }

    const isMatch = await comparePasswords(otp, user.otpHash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "The OTP you entered is incorrect." });
    }

    user.otpHash = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json({ message: "OTP verified successfully." });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// ======================
//  FORGOT / RESET PASSWORD
// ======================

export const forgotPasswordController = async (
  req: Request,
  res: Response
) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || "Invalid input.";
      return res.status(400).json({ message: msg });
    }
    const { email } = parsed.data;

    if (!isAllowedCollegeEmail(email)) {
      return res
        .status(400)
        .json({ message: "Only college emails are allowed." });
    }

    const emailMasked = maskEmail(email);
    const user = await User.findOne({ emailMasked });

    if (!user || !user.isActive) {
      // Prevent user enumeration
      return res.status(200).json({
        message:
          "If an account with this email exists, a password reset OTP has been sent.",
      });
    }

    if (!canSendOtp(user)) {
      return res.status(429).json({
        message:
          "OTP request limit reached for today. Please try again tomorrow.",
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await hashPassword(otp);
    const otpExpiry = new Date(
      Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000
    );

    user.otpHash = hashedOtp;
    user.otpExpiry = otpExpiry;
    registerOtpSend(user);
    await user.save();

    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html: forgotPasswordEmailTemplate({ name: user.name, otp }),
    });

    return res.status(200).json({
      message:
        "If an account with this email exists, a password reset OTP has been sent.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const resetPasswordController = async (
  req: Request,
  res: Response
) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || "Invalid input.";
      return res.status(400).json({ message: msg });
    }
    const { email, otp, newPassword } = parsed.data;

    if (!isAllowedCollegeEmail(email)) {
      return res
        .status(400)
        .json({ message: "Only college emails are allowed." });
    }

    const emailMasked = maskEmail(email);
    const user = await User.findOne({ emailMasked });

    if (!user || !user.otpHash || user.otpExpiry < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP is invalid or has expired." });
    }

    const isMatch = await comparePasswords(otp, user.otpHash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "The OTP you entered is incorrect." });
    }

    user.password = await hashPassword(newPassword);
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    await user.save();

    await sendEmail({
      to: email,
      subject: "Your Password Has Been Reset",
      html: resetPasswordConfirmationTemplate({ name: user.name }),
    });

    return res.status(200).json({
      message: "Password has been reset successfully.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};
