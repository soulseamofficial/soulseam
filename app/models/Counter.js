import mongoose from "mongoose";

/**
 * Counter model for generating sequential order numbers
 * Uses MongoDB atomic operations to guarantee uniqueness even under high concurrency
 */
const CounterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

/**
 * Get next sequential number for a counter
 * Uses atomic findOneAndUpdate with $inc to guarantee uniqueness
 * 
 * @param {string} counterName - Name of the counter (e.g., "orderNumber")
 * @returns {Promise<number>} - Next sequential number
 */
CounterSchema.statics.getNext = async function (counterName) {
  const result = await this.findOneAndUpdate(
    { name: counterName },
    { $inc: { value: 1 } },
    { 
      new: true, 
      upsert: true, // Create counter if it doesn't exist
      setDefaultsOnInsert: true,
    }
  );
  
  return result.value;
};

export default mongoose.models.Counter || mongoose.model("Counter", CounterSchema, "counters");
