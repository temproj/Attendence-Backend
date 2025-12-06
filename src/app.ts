// Path: src/app.ts
import express, { Application, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import applySecurityMiddlewares from "./middlewares/security.middleware";
import publicRoutes from "./routes/public.routes";
import userRoutes from "./routes/user.routes";
import studentRoutes from "./routes/student.routes";
import adminRoutes from "./routes/admin.routes";
import attendanceRoutes from "./routes/attendance.routes";

const app: Application = express();

// Core middlewares
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// 🔐 Security layer (helmet, cors, sanitize, global rate-limit…)
applySecurityMiddlewares(app);

// Health route
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

// Routes
app.use("/api/public", publicRoutes);
app.use("/api/user", userRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found." });
});

// Global error handler (fallback)
app.use(
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Internal server error." });
  }
);

export default app;
