// Path: src/config/connectDB.ts
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.warn(
    "⚠️  MONGO_URI / MONGODB_URI not set. Database connection will fail."
  );
}

let isConnected = false;

/**
 * Connect to MongoDB (safe for Vercel/serverless)
 */
const connectDB = async (): Promise<void> => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(MONGO_URI as string, {
      // options mostly inferred in Mongoose 8
    });

    isConnected = conn.connection.readyState === 1;

    console.log(
      `✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

export default connectDB;
