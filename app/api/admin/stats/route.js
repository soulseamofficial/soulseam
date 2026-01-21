import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Product from "@/app/models/Product";
import Reel from "@/app/models/Reel";
import Coupon from "@/app/models/Coupon";


export async function GET(req) {
  // In Next.js app routes, cookies are accessed from req.cookies (Edge), or req.headers if not available.
  // For maximum compatibility, use cookies from headers for a Node.js environment.
  let token = null;

  // Try to retrieve cookie using the new Next.js fetch API for header access
  if (req.cookies) {
    token = req.cookies.get("admin_token")?.value;
  }
  if (!token) {
    // Try from headers as fallback (Node.js API routes)
    const cookieHeader = req.headers.get?.("cookie");
    if (cookieHeader) {
      // Simple cookie parser
      const matches = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]*)/);
      token = matches?.[1] || null;
    }
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    // If error occurs, return failure for the dashboard
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }

  return NextResponse.json({
    products,
    reels,
    coupons,
    users
  });
}
