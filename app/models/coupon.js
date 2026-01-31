import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ["percentage", "flat"],
    required: true,
    default: "percentage"
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: null,
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: null,
    min: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });


export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
