import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    amount: Number,
    customerName: String,
    status: {
      type: String,
      default: "placed", // placed | shipped | delivered
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order ||
  mongoose.model("Order", OrderSchema);
