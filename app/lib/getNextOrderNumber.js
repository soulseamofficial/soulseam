import { connectDB } from "@/app/lib/db";
import Counter from "@/app/models/Counter";
import mongoose from "mongoose";

/**
 * Atomic order number generator
 * 
 * PRODUCTION-GRADE: Race-condition safe, serverless safe, retry safe
 * 
 * Uses MongoDB atomic findOneAndUpdate with $inc to guarantee uniqueness
 * even under high concurrency across multiple serverless instances.
 * 
 * CRITICAL RULES:
 * - NEVER use countDocuments
 * - NEVER manually increment
 * - NEVER read-then-update
 * - ONLY atomic increment
 * 
 * @param {mongoose.ClientSession} session - Optional MongoDB session for transactions
 * @returns {Promise<string>} - Sequential order number (e.g., "SS0001", "SS0013")
 */
export async function getNextOrderNumber(session = null) {
  await connectDB();
  
  const options = {
    new: true,
    upsert: true
  };
  
  // Include session if provided (for transactions)
  if (session) {
    options.session = session;
  }
  
  const counter = await Counter.findOneAndUpdate(
    { _id: "orderNumber" },
    { $inc: { sequence_value: 1 } },
    options
  );

  return `SS${String(counter.sequence_value).padStart(4, "0")}`;
}
