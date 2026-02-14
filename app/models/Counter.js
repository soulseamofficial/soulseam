import mongoose from "mongoose";

/**
 * Counter model for generating sequential order numbers
 * Uses MongoDB atomic operations to guarantee uniqueness even under high concurrency
 * 
 * Schema:
 * {
 *   _id: String (e.g., "orderNumber"),
 *   sequence_value: Number
 * }
 */
const CounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    sequence_value: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { 
    _id: true, // Keep _id as the identifier
    timestamps: false // No timestamps needed for counters
  }
);

export default mongoose.models.Counter || mongoose.model("Counter", CounterSchema, "counters");
