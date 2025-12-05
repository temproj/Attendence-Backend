// Path: src/middlewares/security.middleware.ts
import { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import xssClean from "xss-clean";
import rateLimit from "express-rate-limit";

export const applySecurityMiddlewares = (app: Express) => {
  // Trust proxy for secure cookies behind Vercel / proxies
  app.set("trust proxy", 1);

  // Basic security headers
  app.use(helmet());

  // CORS – only allowed origin
  const allowedOrigin = process.env.FRONTEND_ORIGIN || "*";

  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
    })
  );

  // Prevent HTTP parameter pollution
  app.use(hpp());

  // NoSQL injection guard for Mongo
  app.use(mongoSanitize());

  // XSS basic protection
  app.use(xssClean());

  // Generic rate limit (per IP)
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests / 15 min
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(globalLimiter);
};

export default applySecurityMiddlewares;
