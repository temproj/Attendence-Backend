// Path: src/routes/public.routes.ts
import { Router } from "express";
import { getLastUpdateController } from "../controllers/public.controller";

const publicRoutes = Router();

// Health check
publicRoutes.get("/ping", (_req, res) => {
  res.status(200).json({ message: "pong" });
});

// Last attendance update timestamp
publicRoutes.get("/last-update", getLastUpdateController);

export default publicRoutes;
