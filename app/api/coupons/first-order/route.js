import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Coupon from "@/app/models/coupon";

export async function GET(req) {
  try {
    await connectDB();

    // Find active first-order coupon
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const coupon = await Coupon.findOne({
      isFirstOrderCoupon: true,
      isActive: true,
    });

    console.log("[Coupons First-Order] Query result:", {
      found: !!coupon,
      couponCode: coupon?.code,
      isActive: coupon?.isActive,
      isFirstOrderCoupon: coupon?.isFirstOrderCoupon,
      expiryDate: coupon?.expiryDate,
    });

    if (!coupon) {
      console.log("[Coupons First-Order] No active first-order coupon found");
      return NextResponse.json(
        { success: false, coupon: null },
        { status: 200 }
      );
    }

    // Check if coupon is expired
    const expiryDate = new Date(coupon.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);
    
    console.log("[Coupons First-Order] Expiry check:", {
      expiryDate: expiryDate.toISOString(),
      now: now.toISOString(),
      isExpired: expiryDate < now,
    });
    
    if (expiryDate < now) {
      console.log("[Coupons First-Order] Coupon is expired");
      return NextResponse.json(
        { success: false, coupon: null },
        { status: 200 }
      );
    }

    // Return coupon details (excluding sensitive fields)
    const response = {
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount,
        expiryDate: coupon.expiryDate,
      },
    };
    
    console.log("[Coupons First-Order] Returning coupon:", response);
    return NextResponse.json(response);
  } catch (err) {
    console.error("[Coupons First-Order] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch first-order coupon" },
      { status: 500 }
    );
  }
}
