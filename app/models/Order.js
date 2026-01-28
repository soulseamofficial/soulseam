import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    // New (required by spec)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    guestUserId: { type: mongoose.Schema.Types.ObjectId, ref: "GuestUser", default: null, index: true },

    // Snapshot (never reference mutable user.addresses)
    shippingAddressSnapshot: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },

    coupon: {
      code: String,
      discount: Number,
    },

    paymentMethod: { type: String, default: "" }, // COD | ONLINE
    paymentStatus: { type: String, default: "pending" }, // pending | paid | cod
    orderStatus: { type: String, default: "placed" }, // placed

    // ---- Legacy fields kept for existing admin UI (checkout previously wrote these) ----
    customer: {
      email: String,
      firstName: String,
      lastName: String,
      phone: String,
    },

    shippingAddress: {
      address: String,
      apt: String,
      city: String,
      state: String,
      pin: String,
      country: String,
    },

    items: Array,

    subtotal: Number,
    discount: Number,
    shipping: Number,
    total: Number,

    payment: {
      method: {
        type: String,
        enum: ["not_selected", "cod", "online"],
        default: "not_selected",
      },
      status: {
        type: String,
        enum: ["not_selected", "cod", "paid"],
        default: "not_selected",
      },
      razorpayPaymentId: String,
    },

    legacyOrderStatus: {
      type: String,
      default: "created", // created | paid | shipped | delivered
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order ||
  mongoose.model("Order", OrderSchema);