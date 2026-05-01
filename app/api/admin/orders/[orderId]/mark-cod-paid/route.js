import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import Order from "@/app/models/Order";

/**
 * PATCH /api/admin/orders/:orderId/mark-cod-paid
 * 
 * Manually mark a COD order as fully paid after delivery.
 * This is a manual admin action and does NOT trigger webhooks.
 * 
 * Requirements:
 * - Order must exist
 * - paymentMethod must be "COD"
 * - orderStatus must be "DELIVERED"
 * - paymentStatus must NOT be "PAID" (can be PARTIALLY_PAID or PENDING)
 * 
 * Updates:
 * - paymentStatus: PARTIALLY_PAID/PENDING -> PAID
 * - remainingCOD: set to 0
 * - codCollectedAt: current timestamp
 * - codCollectedBy: admin ID (optional)
 */
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
    const { authorized, admin, error } = await requireAdminAuth(req);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Validate payment method is COD
    if (order.paymentMethod !== "COD") {
      return NextResponse.json(
        { success: false, error: "This action is only available for COD orders" },
        { status: 400 }
      );
    }

    // Validate order status is DELIVERED
    if (order.orderStatus !== "DELIVERED") {
      return NextResponse.json(
        { success: false, error: "Order must be DELIVERED to mark COD as paid" },
        { status: 400 }
      );
    }

    // Validate payment status is not already PAID
    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        { success: false, error: "Order is already marked as PAID" },
        { status: 400 }
      );
    }

    // Calculate remaining COD before marking as paid (for validation/logging)
    // Formula: remainingCOD = Math.max(subtotal - advancePaid, 0)
    const subtotal = order.subtotal || 0;
    const advancePaid = order.advancePaid || 0;
    const calculatedRemaining = Math.max(subtotal - advancePaid, 0);

    // Prepare update data - mark as fully paid
    const updateData = {
      paymentStatus: "PAID",
      remainingCOD: 0, // Set to 0 when fully paid
      codCollectedAt: new Date(),
    };

    // Optionally store admin ID who marked as paid
    if (admin?._id) {
      updateData.codCollectedBy = admin._id;
    }

    // Update order atomically
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: "Failed to update order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "COD marked as fully paid",
      order: {
        _id: updatedOrder._id,
        paymentStatus: updatedOrder.paymentStatus,
        remainingCOD: updatedOrder.remainingCOD,
        codCollectedAt: updatedOrder.codCollectedAt,
        codCollectedBy: updatedOrder.codCollectedBy,
      },
    });
  } catch (error) {
    console.error("[Admin Mark COD Paid] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark COD as paid" },
      { status: 500 }
    );
  }
}
