import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
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

    orderStatus: {
      type: String,
      enum: ["draft", "confirmed"],
      default: "draft",
    },

    // Delivery
    deliveryStatus: {
      type: String,
      enum: ["not_created", "created"],
      default: "not_created",
    },
    deliveryPartner: String,
    trackingId: String,
    awb: String,
    pickupScheduled: Boolean,
  },
  { timestamps: true }
);

export default mongoose.models.Order ||
  mongoose.model("Order", OrderSchema);