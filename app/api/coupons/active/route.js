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
    
    // Get today's date (start of day for comparison)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all active coupons that haven't expired (expiryDate > today)
    const allCoupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: today }
    }).lean();

    // Filter coupons based on eligibility
    const eligibleCoupons = [];

    for (const coupon of allCoupons) {
      // If it's a first-order coupon, check eligibility
      if (coupon.isFirstOrderCoupon === true) {
        // User must be logged in
        if (!authUser) {
          continue; // Skip this coupon
        }

        // Get user's order count
        const user = await User.findById(authUser._id).lean();
        if (!user || user.orderCount !== 0) {
          continue; // Skip if user doesn't exist or has orders
        }

        // User is eligible for first-order coupon
        eligibleCoupons.push({
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount || null
        });
      } else {
        // Regular coupon - available to everyone
        eligibleCoupons.push({
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount || null
        });
      }
    }

    return NextResponse.json(eligibleCoupons, { status: 200 });
  } catch (err) {
    console.error("[Coupons Active] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch active coupons" },
      { status: 500 }
    );
  }
}
