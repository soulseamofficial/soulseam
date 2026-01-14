import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  discount: Number,
  expiry: Date,
  active: Boolean
}, { timestamps: true });


export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
