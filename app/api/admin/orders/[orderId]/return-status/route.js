import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { requireAdminAuth } from "@/app/lib/adminAuth";

export async function PATCH(req, { params }) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await params;
    const body = await req.json();
    const { returnStatus, refundStatus } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!returnStatus) {
      return NextResponse.json(
        { success: false, error: "Return status is required" },
        { status: 400 }
      );
    }

    // Validate return status
    const validStatuses = ["REQUESTED", "APPROVED", "REJECTED", "PICKUP_SCHEDULED", "COMPLETED"];
    if (!validStatuses.includes(returnStatus)) {
      return NextResponse.json(
        { success: false, error: "Invalid return status" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {
      returnStatus,
      returnRequested: true, // Ensure returnRequested is true
    };

    // Set returnApprovedAt when status changes to APPROVED
    if (returnStatus === "APPROVED" && order.returnStatus !== "APPROVED") {
      updateData.returnApprovedAt = new Date();
    }

    // Set returnRequestedAt if not already set
    if (!order.returnRequestedAt) {
      updateData.returnRequestedAt = new Date();
    }

    // Update refund status if provided
    if (refundStatus) {
      const validRefundStatuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];
      if (validRefundStatuses.includes(refundStatus)) {
        updateData.refundStatus = refundStatus;
      }
    }

    // Auto-set refund status based on return status
    if (returnStatus === "COMPLETED" && !refundStatus) {
      updateData.refundStatus = "PENDING"; // Default to PENDING when return is completed
    }

    // Update the order
    await Order.findByIdAndUpdate(orderId, { $set: updateData });

    // Fetch updated order
    const updatedOrder = await Order.findById(orderId);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Return status updated to ${returnStatus}`,
    });
  } catch (error) {
    console.error("[Admin Return Status] Update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update return status" },
      { status: 500 }
    );
  }
}
