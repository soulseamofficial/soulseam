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

const AddressSnapshotSchema = new mongoose.Schema(
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

const OrderDraftSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    guestUserId: { type: mongoose.Schema.Types.ObjectId, ref: "GuestUser", default: null, index: true },

    shippingAddress: { type: AddressSnapshotSchema, required: true },
    items: { type: [OrderItemSchema], default: [] },
    coupon: { type: CouponSchema, default: null },

    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },

    status: { type: String, default: "draft" }, // draft
    paymentStatus: { type: String, default: "pending" }, // pending
  },
  { timestamps: true }
);

// Ensure one order is either user OR guest (server validates; this is an extra safety net)
OrderDraftSchema.pre("validate", function (next) {
  const hasUser = !!this.userId;
  const hasGuest = !!this.guestUserId;
  if (hasUser === hasGuest) {
    return next(new Error("Draft must have exactly one of userId or guestUserId"));
  }
  next();
});

export default mongoose.models.OrderDraft ||
  mongoose.model("OrderDraft", OrderDraftSchema, "orders_draft");

