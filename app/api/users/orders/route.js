import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import Order from "@/app/models/Order";

export async function GET() {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find orders for the authenticated user (both userId and guestUserId)
    const orders = await Order.find({
      $or: [
        { userId: user._id },
        { guestUserId: user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      orders: orders || [],
    });
  } catch (error) {
    console.error("[Users Orders] Fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
