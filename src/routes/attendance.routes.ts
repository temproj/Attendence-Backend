// Path: src/routes/attendance.routes.ts
import { Router } from "express";
import authMiddleware, { authorize } from "../middlewares/authMiddleware";
import { biometricUpload } from "../middlewares/upload.middleware";
import { uploadBiometricAttendance } from "../controllers/attendance.controller";

const router = Router();

router.post(
  "/upload/biometric",
  authMiddleware,
  authorize(["ADMIN", "DEVELOPER"]), // chahe to HOD add
  biometricUpload.single("file"), // accept .dat/.txt biometric file
  uploadBiometricAttendance
);

export default router;
