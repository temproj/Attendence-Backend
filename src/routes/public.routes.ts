// Path: src/routes/public.routes.ts
import { Router } from "express";

const router = Router();

router.get("/ping", (_req, res) => {
  res.status(200).json({ message: "pong" });
});

export default router;
