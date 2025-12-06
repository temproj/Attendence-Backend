// Path: src/routes/admin.routes.ts
import { Router } from "express";
import authMiddleware, { authorize } from "../middlewares/authMiddleware";
import verifySecretHeader from "../middlewares/secretHeader.middleware";
import {
  addHolidayController,
  revertLastUploadsController,
  deleteSemesterDataController,
  filterStudentsController,
  promoteAndClearSemesterController,
  updateUserDetailsByAdminController,
} from "../controllers/admin.controller";

const adminRoutes = Router();

// 🔐 Extra safety: only requests with correct x-internal-secret
adminRoutes.use(verifySecretHeader);

// 👮 Every route here: only ADMIN
adminRoutes.use(authMiddleware, authorize("ADMIN"));

// --- Holiday Management ---
adminRoutes.post("/holidays/add", addHolidayController);

// --- Attendance Data Management ---
adminRoutes.delete("/attendance/revert-uploads", revertLastUploadsController);
adminRoutes.delete("/attendance/delete-semester", deleteSemesterDataController);

// --- User Management Routes ---
adminRoutes.get("/students/filter", filterStudentsController);
adminRoutes.put("/students/update/:userId", updateUserDetailsByAdminController);
adminRoutes.post(
  "/attendance/promote-semester",
  promoteAndClearSemesterController
);

export default adminRoutes;
