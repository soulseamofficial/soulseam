import mongoose from "mongoose";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(
      "✅ MongoDB connected to:",
      mongoose.connection.db.databaseName
    );
  } catch (error) {
    console.error("❌ MongoDB connection failed", error);
    throw new Error("DB connection failed");
  }
}
