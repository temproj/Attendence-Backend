// Path: src/middlewares/secretHeader.middleware.ts
import { Request, Response, NextFunction } from "express";

export const verifySecretHeader = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const secretHeader = req.headers["x-internal-secret"];

  if (!secretHeader || secretHeader !== process.env.FRONTEND_SECRET_HEADER_KEY) {
    return res
      .status(403)
      .json({ message: "Forbidden: Invalid Access Source." });
  }

  next();
};

export default verifySecretHeader;
