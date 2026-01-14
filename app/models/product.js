import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, unique: true, required: true },
    price: Number,
    description: String,
    stock: Number,
    category: String,
    images: [String]
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
