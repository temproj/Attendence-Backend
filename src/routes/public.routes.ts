// Path: src/routes/public.routes.ts
import { Router } from "express";
import { getLastUpdateController } from "../controllers/public.controller";

const router = Router();

// Health check
router.get("/ping", (_req, res) => {
  res.status(200).json({ message: "pong" });
});

// Last attendance update timestamp
router.get("/last-update", getLastUpdateController);

export default router;
