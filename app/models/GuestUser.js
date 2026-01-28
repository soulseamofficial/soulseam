import mongoose from "mongoose";

const GuestUserSchema = new mongoose.Schema(
  {
    // One guest record per checkout session (idempotent upsert)
    guestSessionId: { type: String, required: true, unique: true, index: true },

    name: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },

    shippingAddress: {
      fullName: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      addressLine1: { type: String, trim: true, default: "" },
      addressLine2: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      pincode: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "India" },
    },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export default mongoose.models.GuestUser ||
  mongoose.model("GuestUser", GuestUserSchema, "guest_users");

