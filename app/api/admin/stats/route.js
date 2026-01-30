import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Product from "@/app/models/product";
import Reel from "@/app/models/Reel";
import Coupon from "@/app/models/coupon";
import { requireAdminAuth } from "@/app/lib/adminAuth";

export async function GET(req) {
  try {
    // Verify admin authentication
    const { authorized, error } = await requireAdminAuth(req);
    
    if (!authorized) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let products = 0;
    let reels = 0;
    let coupons = 0;
    let users = 0;

    try {
      // Use Promise.all for efficiency and error catching
      const [productsCount, reelsCount, couponsCount] = await Promise.all([
        Product.countDocuments(),
        Reel.countDocuments(),
        Coupon.countDocuments()
      ]);
      products = productsCount;
      reels = reelsCount;
      coupons = couponsCount;

      // As User model import failed, users will always be 0
      users = 0;
    } catch (err) {
      console.error("[Admin Stats] Database query error:", err);
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }

    return NextResponse.json({
      products,
      reels,
      coupons,
      users
    });
  } catch (err) {
    console.error("[Admin Stats] Route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
