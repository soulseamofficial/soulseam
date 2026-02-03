import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import Order from "@/app/models/Order";

export async function PATCH(req, { params }) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Verify admin authentication
    const { authorized, error } = await requireAdminAuth(req);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { orderStatus } = await req.json();

    if (!orderStatus) {
      return NextResponse.json(
        { success: false, error: "Order status is required" },
        { status: 400 }
      );
    }

    // Validate order status
    const validStatuses = ["CREATED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(orderStatus)) {
      return NextResponse.json(
        { success: false, error: "Invalid order status" },
        { status: 400 }
      );
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {
      orderStatus,
    };

    // If status is DELIVERED and deliveredAt is not set, set it now
    if (orderStatus === "DELIVERED" && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    // Update order
    await Order.findByIdAndUpdate(orderId, { $set: updateData });

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${orderStatus}`,
      deliveredAt: updateData.deliveredAt || order.deliveredAt,
    });
  } catch (error) {
    console.error("[Admin Update Order Status] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
