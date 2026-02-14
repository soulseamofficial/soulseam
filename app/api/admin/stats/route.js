import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Product from "@/app/models/product";
import Reel from "@/app/models/Reel";
import Coupon from "@/app/models/coupon";
import User from "@/app/models/User";
import GuestUser from "@/app/models/GuestUser";
import Order from "@/app/models/Order";
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
    let totalUsers = 0;
    let totalGuestUsers = 0;
    let totalOrders = 0;
    let totalProducts = 0;

    try {
      // Use Promise.all for efficiency - fetch all counts in parallel
      const [productsCount, reelsCount, couponsCount, usersCount, guestUsersCount, ordersCount] = await Promise.all([
        Product.countDocuments(),
        Reel.countDocuments(),
        Coupon.countDocuments(),
        User.countDocuments(),
        GuestUser.countDocuments(),
        Order.countDocuments()
      ]);
      products = productsCount;
      totalProducts = productsCount;
      reels = reelsCount;
      coupons = couponsCount;
      totalUsers = usersCount;
      totalGuestUsers = guestUsersCount;
      totalOrders = ordersCount;
    } catch (err) {
      console.error("[Admin Stats] Database query error:", err);
      // Return partial data with 0s for failed queries instead of error
      // This prevents dashboard crash
      return NextResponse.json({
        products,
        totalProducts,
        reels,
        coupons,
        totalUsers,
        totalGuestUsers,
        totalOrders,
        orders: totalOrders,
        users: totalUsers
      });
    }

    return NextResponse.json({
      products,
      totalProducts,
      reels,
      coupons,
      totalUsers,
      totalGuestUsers,
      totalOrders,
      orders: totalOrders,
      users: totalUsers
    });
  } catch (err) {
    console.error("[Admin Stats] Route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
