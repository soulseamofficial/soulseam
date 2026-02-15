import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { requireAdminAuth } from "@/app/lib/adminAuth";

export async function GET(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // Fetch orders where return is requested or has a return status
    // IMPORTANT: Always exclude deleted orders
    const returnOrders = await Order.find({
      $or: [
        { returnRequested: true },
        { returnStatus: { $in: ["REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "COMPLETED", "REJECTED"] } }
      ],
      // Exclude cancelled or failed orders
      orderStatus: { $ne: "CANCELLED" },
      paymentStatus: { $ne: "FAILED" },
      // Exclude deleted orders
      isDeleted: { $ne: true }
    })
      .sort({ returnRequestedAt: -1, createdAt: -1 })
      .lean(); // Use lean() to get plain JavaScript objects for better JSON serialization

    return NextResponse.json({
      success: true,
      orders: returnOrders,
      count: returnOrders.length,
    });
  } catch (error) {
    console.error("[Admin Return Orders] Fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch return orders" },
      { status: 500 }
    );
  }
}
