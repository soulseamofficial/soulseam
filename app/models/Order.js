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

    items: [
      {
        productId: String,
        name: String,
        image: String,
        size: String,
        color: String,
        price: Number,
        quantity: Number,
      }
    ],

    subtotal: Number,
    discount: Number,
    shipping: Number,
    total: Number,

    payment: {
      method: String, // Razorpay
      status: String, // pending | paid
      razorpayOrderId: String,
      razorpayPaymentId: String,
    },

    orderStatus: {
      type: String,
      default: "created", // created | paid | shipped | delivered
    }
  },
  { timestamps: true }
);

export default mongoose.models.Order ||
  mongoose.model("Order", OrderSchema);