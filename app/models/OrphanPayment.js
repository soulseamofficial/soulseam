import mongoose from "mongoose";

const OrphanPaymentSchema = new mongoose.Schema(
  {
    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    amountInPaise: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    event: { type: String, required: true },
    paymentStatus: { type: String, default: "captured" },
    rawPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    processed: { type: Boolean, default: false },
    processedAt: { type: Date, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.OrphanPayment || mongoose.model("OrphanPayment", OrphanPaymentSchema, "orphan_payments");
