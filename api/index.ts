// Path: api/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app.js";
import connectDB from "../src/config/connectDB.js";

// Lazy DB connect per cold start
let dbReady: Promise<void> | null = null;

const ensureDB = () => {
  if (!dbReady) {
    dbReady = connectDB();
  }
  return dbReady;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureDB();
  // @ts-ignore – Express and VercelRequest are compatible enough here
  return app(req, res);
}
