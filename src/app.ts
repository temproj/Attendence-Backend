// Path: src/app.ts
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import applySecurityMiddlewares from "./middlewares/security.middleware.js";
import publicRoutes from "./routes/public.routes.js";
// baad me yahan user/admin/student/attendance routes bhi import karenge

const app = express();

// Core middlewares
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Security layer (helmet, cors, sanitize, rate-limit…)
applySecurityMiddlewares(app);

// Health route
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

// Public routes
app.use("/api/public", publicRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

export default app;
