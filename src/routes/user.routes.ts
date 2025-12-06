// Path: src/routes/user.routes.ts
import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import verifySecretHeader from "../middlewares/secretHeader.middleware";
import {
  loginLimiter,
  otpLimiter,
  forgotPasswordLimiter,
} from "../middlewares/rateLimiter.middleware";
import {
  loginUserController,
  logoutUserController,
  generateOtpController,
  verifyOtpController,
  forgotPasswordController,
  resetPasswordController,
  // registerUserController, // future ke liye
} from "../controllers/user.controller";

const userRoutes = Router();

// 🔐 Sab auth-related routes sirf tumhare frontend se
userRoutes.use(verifySecretHeader);

// --- AUTH ROUTES ---

// NOTE: students khud register nahi karte – future me admin tool ke liye bana sakte
// userRoutes.post("/register", loginLimiter, registerUserController);

// Login – IP based brute-force protection
userRoutes.post("/login", loginLimiter, loginUserController);

// Logout – sirf valid auth wale
userRoutes.post("/logout", authMiddleware, logoutUserController);

// Post-login OTP generate
userRoutes.post(
  "/post-login/otp/generate",
  authMiddleware,
  otpLimiter,
  generateOtpController
);

// Post-login OTP verify
userRoutes.post(
  "/post-login/otp/verify",
  authMiddleware,
  otpLimiter,
  verifyOtpController
);

// Forgot password – enumeration + abuse safe
userRoutes.post(
  "/password/forgot",
  forgotPasswordLimiter,
  forgotPasswordController
);

// Reset password – same limiter, OTP + new pass
userRoutes.post(
  "/password/reset",
  forgotPasswordLimiter,
  resetPasswordController
);

// Simple "me" route
userRoutes.get("/me", authMiddleware, (req, res) => {
  res.json({ message: "OK", user: req.user });
});

export default userRoutes;
