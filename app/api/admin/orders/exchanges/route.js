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

    // Fetch orders where exchange is requested or has an exchange status
    const exchangeOrders = await Order.find({
      $or: [
        { exchangeRequested: true },
        { exchangeStatus: { $in: ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"] } }
      ],
      // Exclude cancelled or failed orders
      orderStatus: { $ne: "CANCELLED" },
      paymentStatus: { $ne: "FAILED" }
    })
      .sort({ exchangeRequestedAt: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      orders: exchangeOrders,
      count: exchangeOrders.length,
    });
  } catch (error) {
    console.error("[Admin Exchange Orders] Fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exchange orders" },
      { status: 500 }
    );
  }
}
