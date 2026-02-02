import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: false, trim: true, default: "" },
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
    email: { type: String, unique: true, required: false, sparse: true, trim: true, lowercase: true },
    phone: { type: String, unique: true, sparse: true, required: false, trim: true },

    // Local auth (MongoDB) - required by new auth routes
    passwordHash: { type: String, select: false },

    // Optional legacy / 3rd-party auth fields (kept for compatibility)
    firebaseUid: { type: String, default: null },
    provider: { type: String, default: "local" }, // local | email(firebase) | ...

    // Authentication method tracking
    loginMethod: { type: String, enum: ["email", "phone"], required: false }, // "email" | "phone"
    emailVerified: { type: Boolean, default: false }, // For email users
    isPhoneVerified: { type: Boolean, default: false }, // For phone users
    isVerified: { type: Boolean, default: false }, // General verification status

    role: { type: String, default: "user" },

    // Order tracking
    orderCount: { type: Number, default: 0 },
    firstOrderCouponUsed: { type: Boolean, default: false },

    // Address book (unlimited)
    addresses: { type: [AddressSchema], default: [] },
  },
  { timestamps: true }
);

// Virtual field for password (allows setting password which gets hashed to passwordHash)
UserSchema.virtual('password').set(function(value) {
  this._password = value;
  // Mark passwordHash as modified so we know to hash it
  this.markModified('passwordHash');
});

// Custom validation: At least one of email or phone must be provided before saving
UserSchema.pre('save', async function () {
  // Require at least one contact method
  if (!this.email && !this.phone) {
    throw new Error('Either email or phone is required');
  }

  // Hash password only if modified
  if (this._password) {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this._password, salt);
    delete this._password;
  }
});

export default mongoose.models.User ||
  mongoose.model("User", UserSchema);
