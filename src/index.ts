// Path: src/index.ts
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import connectDB from "./config/connectDB.js";
import applySecurityMiddlewares from "./middlewares/security.middleware.js";

// (In next steps we will create these route files)
import publicRoutes from "./routes/public.routes.js";
// other routes (user/admin/student/attendance) will be wired later

const app = express();

// Core middlewares
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Security layer (helmet, cors, sanitize, rate-limit…)
applySecurityMiddlewares(app);

// Simple health route (public)
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

// Public routes (we will extend later)
app.use("/api/public", publicRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Global error handler (fallback)
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Internal server error." });
  }
);

// Start server (for dev/local)
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server start failed:", error);
    process.exit(1);
  }
};

startServer();

export default app;
