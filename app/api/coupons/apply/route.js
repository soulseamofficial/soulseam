import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Coupon from "@/app/models/coupon";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { code, cartTotal } = body;

    // Validate input
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Coupon code is required" },
        { status: 400 }
      );
    }

    if (cartTotal === undefined || typeof cartTotal !== "number" || cartTotal < 0) {
      return NextResponse.json(
        { success: false, error: "Valid cart total is required" },
        { status: 400 }
      );
    }

    // 1. Find coupon - validate coupon exists
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: "Invalid coupon code" },
        { status: 404 }
      );
    }

    // 2. Validate coupon is active
    if (coupon.isActive !== true) {
      return NextResponse.json(
        { success: false, error: "This coupon is not active" },
        { status: 400 }
      );
    }

    // 3. Validate expiryDate is valid AND expiryDate >= today
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for comparison
    
    const expiryDate = new Date(coupon.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "This coupon has an invalid expiry date" },
        { status: 400 }
      );
    }
    
    expiryDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
    if (expiryDate < now) {
      return NextResponse.json(
        { success: false, error: "This coupon has expired" },
        { status: 400 }
      );
    }

    // 4. Validate minimum order amount (if exists)
    if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Minimum order amount of ₹${coupon.minOrderAmount} required` 
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;

    if (coupon.discountType === "percentage") {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      // Apply max discount limit if exists
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else if (coupon.discountType === "flat") {
      discountAmount = coupon.discountValue;
    }

    // Calculate final total (ensure it never goes below 0)
    const finalTotal = Math.max(cartTotal - discountAmount, 0);

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;
    const roundedFinalTotal = Math.round(finalTotal * 100) / 100;

    return NextResponse.json({
      success: true,
      discountAmount,
      finalTotal: roundedFinalTotal,
    });
  } catch (err) {
    console.error("[Coupon Apply] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to apply coupon" },
      { status: 500 }
    );
  }
}
