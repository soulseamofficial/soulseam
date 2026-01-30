import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const ShippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: "India" },
  },
  { _id: false }
);

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, trim: true },
    discount: { type: Number, default: 0 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    guestUserId: { type: mongoose.Schema.Types.ObjectId, ref: "GuestUser", default: null, index: true },

    items: { type: [OrderItemSchema], required: true, default: [] },
    shippingAddress: { type: ShippingAddressSchema, required: true },

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ["CREATED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      required: true,
      default: "CREATED",
    },

    coupon: { type: CouponSchema, default: null },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    shipping: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    // Razorpay payment details (for ONLINE payments)
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },

    // Delhivery tracking details
    delhiveryWaybill: { type: String, default: null, index: true },
    delhiveryCourierName: { type: String, default: null },
    delhiveryDeliveryStatus: { type: String, default: null },
    delhiveryTrackingUrl: { type: String, default: null },
    delhiverySent: { type: Boolean, default: false },
    delhiveryError: { type: String, default: null },
    
    // Delivery provider and status (standardized fields)
    delivery_provider: { 
      type: String, 
      enum: ["DELHIVERY", "OTHER", null], 
      default: null,
      index: true,
    },
    delivery_status: {
      type: String,
      enum: ["CREATED", "NOT_SENT", "SENT", "IN_TRANSIT", "DELIVERED", "FAILED", null],
      default: null,
    },
    
    // Legacy Delhivery fields (for backward compatibility)
    delhiveryAWB: { type: String, default: null },
    delhiveryTrackingId: { type: String, default: null },
    delhiveryPartner: { type: String, default: null },

    // Legacy fields for backward compatibility with existing admin UI
    customer: {
      email: String,
      firstName: String,
      lastName: String,
      phone: String,
    },
    shippingAddressLegacy: {
      address: String,
      apt: String,
      city: String,
      state: String,
      pin: String,
      country: String,
    },
    payment: {
      method: {
        type: String,
        enum: ["not_selected", "COD", "Razorpay"],
        default: "not_selected",
      },
      status: {
        type: String,
        enum: ["not_selected", "pending", "paid"],
        default: "not_selected",
      },
      razorpayPaymentId: String,
    },
    legacyOrderStatus: {
      type: String,
      default: "created",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema, "orders");
