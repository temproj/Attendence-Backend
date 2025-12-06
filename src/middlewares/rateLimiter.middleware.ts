// Path: src/middlewares/rateLimiter.middleware.ts
import rateLimit from "express-rate-limit";

/**
 * Generic limiter for all API (fallback).
 * e.g. 300 requests / 15 min per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
});

/**
 * Login limiter – protect password brute force
 * e.g. 10 attempts / 15 min per IP.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again after some time.",
  },
});

/**
 * OTP-related endpoints – protect from abuse
 * e.g. 10 OTP-related requests / 15 min per IP.
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many OTP requests. Please try again later.",
  },
});

/**
 * Forgot/reset password limiter – to block enumeration attacks
 * e.g. 5 per 30 min per IP.
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many password reset requests from this IP. Please try again later.",
  },
});
