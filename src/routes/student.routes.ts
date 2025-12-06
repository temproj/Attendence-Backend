// Path: src/routes/student.routes.ts
import { Router } from "express";
import authMiddleware, { authorize } from "../middlewares/authMiddleware";
import verifySecretHeader from "../middlewares/secretHeader.middleware";
import { getMyAttendanceController } from "../controllers/student.controller";

const studentRoutes = Router();

// Only internal frontend
studentRoutes.use(verifySecretHeader);

// Every student route: only STUDENT group
studentRoutes.use(authMiddleware, authorize("STUDENT"));

// --- Main Student Route ---
studentRoutes.get("/my-attendance", getMyAttendanceController);

export default studentRoutes;
