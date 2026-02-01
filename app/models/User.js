import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: "India" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const UserSchema = new mongoose.Schema(
  {
    // Core identity
    name: { type: String, trim: true, default: "" },
    email: { type: String, unique: true, required: true, trim: true, lowercase: true },
    phone: { type: String, unique: true, sparse: true, trim: true },

    // Local auth (MongoDB) - required by new auth routes
    passwordHash: { type: String, select: false },

    // Optional legacy / 3rd-party auth fields (kept for compatibility)
    firebaseUid: { type: String, default: null },
    provider: { type: String, default: "local" }, // local | email(firebase) | ...

    role: { type: String, default: "user" },

    // Order tracking
    orderCount: { type: Number, default: 0 },
    firstOrderCouponUsed: { type: Boolean, default: false },

    // Address book (unlimited)
    addresses: { type: [AddressSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model("User", UserSchema);
