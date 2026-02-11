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
    discountAmount: { type: Number, default: 0 }, // Alias for discount, for clarity
    shipping: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    finalTotal: { type: Number, default: 0 }, // Alias for totalAmount, for clarity

    // COD Advance Payment fields
    advancePaid: { type: Number, default: 0, min: 0 },
    remainingCOD: { type: Number, default: 0, min: 0 },

    // Order number (unique identifier like SS0001, SS0002, etc.)
    orderNumber: { type: String, default: null, unique: true, sparse: true, index: true },

    // Razorpay payment details (for ONLINE payments and COD advance)
    razorpayOrderId: { type: String, default: null, unique: true, sparse: true, index: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    
    // Payment timestamp
    paidAt: { type: Date, default: null },

    // Delhivery tracking details
    delhiveryWaybill: { type: String, default: null, index: true },
    delhiveryCourierName: { type: String, default: null },
    delhiveryDeliveryStatus: { type: String, default: null },
    delhiveryTrackingUrl: { type: String, default: null },
    delhiverySent: { type: Boolean, default: false },
    delhiveryError: { type: String, default: null },
    isShipmentCreated: { type: Boolean, default: false, index: true },
    courierResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    
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

    // Exchange-related fields (replaced return system)
    deliveredAt: { type: Date, default: null },
    exchangeRequested: { type: Boolean, default: false },
    exchangeRequestedAt: { type: Date, default: null },
    exchangeStatus: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED", null],
      default: null,
    },
    exchangeReason: { type: String, default: null, trim: true },
    exchangeType: {
      type: String,
      enum: ["SIZE", "COLOR", "DEFECT", "WRONG_ITEM", null],
      default: null,
    },
    exchangeVideo: {
      url: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
    },
    exchangeApprovedAt: { type: Date, default: null },
    exchangeCompletedAt: { type: Date, default: null },

    // Return-related fields
    returnRequested: { type: Boolean, default: false },
    returnRequestedAt: { type: Date, default: null },
    returnStatus: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "COMPLETED", "REJECTED", null],
      default: null,
    },
    returnReason: { type: String, default: null, trim: true },
    returnVideoUrl: { type: String, default: null },
    returnApprovedAt: { type: Date, default: null },
    refundStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", null],
      default: null,
    },

    // Customer personal message/wishes
    orderMessage: {
      type: String,
      default: null,
      trim: true,
      maxlength: 250,
    },

    // Order source tracking
    orderSource: {
      type: String,
      enum: ["WEBSITE", "ADMIN", null],
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema, "orders");
