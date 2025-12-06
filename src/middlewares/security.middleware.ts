// Path: src/middlewares/security.middleware.ts
import { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import xssClean from "xss-clean";
import rateLimit from "express-rate-limit";

export const applySecurityMiddlewares = (app: Express) => {
  // Vercel / proxy ke peeche real IP + secure cookies ke liye
  app.set("trust proxy", 1);

  // Helmet with minimal CSP (React/SPA me kam panga)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS – ENV driven
  // CORS_ALLOWED_ORIGINS = "https://fe1.com,https://fe2.com"
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "*")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins.length === 1 && allowedOrigins[0] === "*"
        ? "*"
        : allowedOrigins,
      credentials: true,
    })
  );

  // Prevent HTTP parameter pollution
  app.use(hpp());

  // NoSQL injection guard for Mongo ($gt, $ne, etc.)
  app.use(mongoSanitize());

  // XSS basic protection
  app.use(xssClean());

  // Global rate limiting (fallback for saare routes)
  const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX || "300", 10), // 300 req/15min
    message: {
      message: "Too many requests, slow down.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(globalLimiter);
};

export default applySecurityMiddlewares;
