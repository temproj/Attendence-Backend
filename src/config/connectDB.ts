// Path: src/config/connectDB.ts
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  throw new Error("❌ MONGO_URI is not set in environment variables");
}

// Vercel / serverless friendly connection reuse
let isConnected = 0; // 0 = not connected, 1 = connected

export const connectDB = async (): Promise<void> => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      // Add options here if needed
    });

    isConnected = conn.connections[0].readyState;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

export default connectDB;
