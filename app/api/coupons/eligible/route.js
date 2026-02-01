import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Coupon from "@/app/models/coupon";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import User from "@/app/models/User";

export async function GET(req) {
  try {
    await connectDB();

    // Get authenticated user (if any)
    const authUser = await getAuthUserFromCookies();
    
    // RULE 1: If not logged in, return empty array
    if (!authUser) {
      return NextResponse.json([], { status: 200 });
    }

    // Get user's order count
    const user = await User.findById(authUser._id).lean();
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const orderCount = user.orderCount ?? 0;

    // Get today's date (start of day for comparison)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // RULE 2: If logged in AND orderCount === 0, return ONLY first-order coupons
    if (orderCount === 0) {
      const firstOrderCoupons = await Coupon.find({
        isFirstOrderCoupon: true,
        isActive: true,
        expiryDate: { $gt: today }
      }).lean();

      const eligibleCoupons = firstOrderCoupons.map((coupon) => ({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount || null,
        isFirstOrderCoupon: true
      }));

      return NextResponse.json(eligibleCoupons, { status: 200 });
    }

    // RULE 3: If orderCount > 0, return ALL active coupons (excluding first-order coupons)
    const allCoupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: today },
      isFirstOrderCoupon: { $ne: true } // Exclude first-order coupons for returning users
    }).lean();

    const eligibleCoupons = allCoupons.map((coupon) => ({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || null,
      isFirstOrderCoupon: false
    }));

    return NextResponse.json(eligibleCoupons, { status: 200 });
  } catch (err) {
    console.error("[Coupons Eligible] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch eligible coupons" },
      { status: 500 }
    );
  }
}
