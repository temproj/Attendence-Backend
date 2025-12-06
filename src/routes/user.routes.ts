// Path: src/routes/user.routes.ts
import { Router } from "express";
import rateLimit from "express-rate-limit";
import authMiddleware from "../middlewares/authMiddleware";
import {
  loginUserController,
  logoutUserController,
  generateOtpController,
  verifyOtpController,
  forgotPasswordController,
  resetPasswordController,
  // registerUserController, // <- abhi implement nahi, isliye use nahi kar rahe
} from "../controllers/user.controller";

const router = Router();

// 🔒 Auth endpoints pe stricter limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, // 20 attempts / 15 min
  message: { message: "Too many requests, please try again later." },
});

// --- Auth routes ---

// NOTE: students khud register nahi karte – future me admin tool ke liye bana sakte
// router.post("/register", authLimiter, registerUserController);

router.post("/login", authLimiter, loginUserController);
router.post("/logout", authMiddleware, logoutUserController);

router.post(
  "/post-login/otp/generate",
  authMiddleware,
  authLimiter,
  generateOtpController
);
router.post(
  "/post-login/otp/verify",
  authMiddleware,
  authLimiter,
  verifyOtpController
);

router.post("/password/forgot", authLimiter, forgotPasswordController);
router.post("/password/reset", authLimiter, resetPasswordController);

// Simple "me" route
router.get("/me", authMiddleware, (req, res) => {
  // @ts-ignore
  res.json({ message: "OK", user: req.user });
});

export default router;
