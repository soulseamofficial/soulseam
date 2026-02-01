import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema(
  {
    // Identifier: phone for WhatsApp, email for Email
    identifier: { type: String, required: true, index: true },
    // Channel: "whatsapp" | "email"
    channel: { type: String, required: true, enum: ["whatsapp", "email"] },
    // Hashed OTP (6-digit)
    otpHash: { type: String, required: true },
    // Expiry timestamp
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    // Verification attempts (max 3)
    attempts: { type: Number, default: 0, max: 3 },
    // Whether OTP has been verified
    verified: { type: Boolean, default: false },
    // IP address for rate limiting
    ipAddress: { type: String, default: null },
    // Timestamp of last OTP send (for resend cooldown)
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for efficient lookups
OTPSchema.index({ identifier: 1, channel: 1, verified: 1 });
OTPSchema.index({ ipAddress: 1, createdAt: 1 });

export default mongoose.models.OTP || mongoose.model("OTP", OTPSchema);
