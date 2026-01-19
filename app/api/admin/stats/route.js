export const runtime = "nodejs";

import { connectDB } from "../../../lib/db";
import Product from "../../../models/product";
import Reel from "../../../models/Reel";
import Coupon from "../../../models/coupon";

export async function GET() {
  try {
    await connectDB();

    const [products, reels, coupons] = await Promise.all([
      Product.countDocuments(),
      Reel.countDocuments(),
      Coupon.countDocuments(),
    ]);

    return Response.json({
      products,
      reels,
      coupons,
      users: 1, // later real users count
    });
  } catch (err) {
    console.error("Stats error:", err);
    return Response.json(
      { message: "Stats failed" },
      { status: 500 }
    );
  }
}
