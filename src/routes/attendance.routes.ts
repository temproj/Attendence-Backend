// Path: src/routes/attendance.routes.ts
import { Router } from "express";
import authMiddleware, { authorize } from "../middlewares/authMiddleware";
import verifySecretHeader from "../middlewares/secretHeader.middleware";
import { biometricUpload } from "../middlewares/upload.middleware";
import { uploadBiometricAttendance } from "../controllers/attendance.controller";

const attendanceRoutes = Router();

// Sirf tumhara frontend / cron access kare
attendanceRoutes.use(verifySecretHeader);

attendanceRoutes.post(
  "/upload/biometric",
  authMiddleware,
  authorize(["ADMIN", "DEVELOPER"]), // chahe to "HOD" add kar sakta hai
  biometricUpload.single("file"), // accept .dat/.txt biometric file
  uploadBiometricAttendance
);

export default attendanceRoutes;
