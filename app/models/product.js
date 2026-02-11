import mongoose from "mongoose";

const SizeSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      enum: ["S", "M", "L", "XL"],
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    compareAtPrice: {
      type: Number,
      default: null,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    images: [String],

    // 🔥 SIZE-WISE STOCK
    sizes: {
      type: [SizeSchema],
      required: true,
    },

    // 🔥 TOTAL STOCK - Cached for atomic updates
    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // 🔥 ACTIVE STATUS - Hide products without deleting them
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔥 PRE-SAVE HOOK: Calculate totalStock from sizes array
ProductSchema.pre("save", async function () {
  if (this.isModified("sizes") || this.isNew) {
    this.totalStock = this.sizes.reduce(
      (sum, size) => sum + (size.stock || 0),
      0
    );
  }
});

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);
