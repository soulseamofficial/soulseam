import mongoose from "mongoose";
import Product from "../../../models/product.js";
import Reel from "../../../models/Reel.js";
import Coupon from "../../../models/coupon.js";

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const [products, reels, coupons] = await Promise.all([
      Product.countDocuments(),
      Reel.countDocuments(),
      Coupon.countDocuments()
    ]);

    return Response.json({
      products,
      reels,
      coupons,
      users: 1
    });
  } catch (err) {
    console.error("Stats error:", err);
    return Response.json({ error: "Stats failed" }, { status: 500 });
  }
}
