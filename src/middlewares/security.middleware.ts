// Path: src/middlewares/security.middleware.ts
import { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import xssClean from "xss-clean";
import rateLimit from "express-rate-limit";

export const applySecurityMiddlewares = (app: Express) => {
  // behind vercel/nginx: allow secure cookies
  app.set("trust proxy", 1);

  // Helmet with minimal CSP to avoid conflicts with frontend
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS – ENV driven for best deployment flexibility
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "*")
    .split(",")
    .map((o) => o.trim());

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );

  // Prevent HTTP parameter pollution
  app.use(hpp());

  // Sanitize against NoSQL Injection
  app.use(mongoSanitize());

  // Basic XSS defense
  app.use(xssClean());

  // Global rate limiting
  const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || "300"), // 300 requests/15min
    message: {
      message: "Too many requests, slow down.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(globalLimiter);
};

export default applySecurityMiddlewares;
