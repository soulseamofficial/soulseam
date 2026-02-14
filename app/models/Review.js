import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 2000,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 4;
        },
        message: "Maximum 4 images allowed",
      },
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound unique index: same email cannot review same product twice
ReviewSchema.index({ productId: 1, email: 1 }, { unique: true });

// Index for faster queries
ReviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
