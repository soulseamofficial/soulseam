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
    const { exchangeStatus } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!exchangeStatus) {
      return NextResponse.json(
        { success: false, error: "Exchange status is required" },
        { status: 400 }
      );
    }

    // Validate exchange status
    const validStatuses = ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"];
    if (!validStatuses.includes(exchangeStatus)) {
      return NextResponse.json(
        { success: false, error: "Invalid exchange status" },
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

    // Enforce video requirement: Cannot approve exchange without video
    if (exchangeStatus === "APPROVED" && (!order.exchangeVideo || !order.exchangeVideo.url || order.exchangeVideo.url.trim().length === 0)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot approve exchange request without video proof. Video proof is mandatory for all exchange requests according to our Exchange Policy. The exchange request must include a valid video (10-30 seconds, max 30 MB, MP4/MOV/WEBM format) showing the product condition. Please reject this request and inform the customer to resubmit with a valid video." 
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      exchangeStatus,
      exchangeRequested: true, // Ensure exchangeRequested is true
    };

    // Set exchangeApprovedAt when status changes to APPROVED
    if (exchangeStatus === "APPROVED" && order.exchangeStatus !== "APPROVED") {
      // Additional validation: Ensure video exists before setting approval timestamp
      if (!order.exchangeVideo || !order.exchangeVideo.url) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Cannot approve exchange request without video proof. Video proof is mandatory for all exchange requests." 
          },
          { status: 400 }
        );
      }
      updateData.exchangeApprovedAt = new Date();
    }

    // Set exchangeCompletedAt when status changes to COMPLETED
    if (exchangeStatus === "COMPLETED" && order.exchangeStatus !== "COMPLETED") {
      updateData.exchangeCompletedAt = new Date();
    }

    // Set exchangeRequestedAt if not already set
    if (!order.exchangeRequestedAt) {
      updateData.exchangeRequestedAt = new Date();
    }

    // Update the order
    await Order.findByIdAndUpdate(orderId, { $set: updateData });

    // Fetch updated order
    const updatedOrder = await Order.findById(orderId);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Exchange status updated to ${exchangeStatus}`,
    });
  } catch (error) {
    console.error("[Admin Exchange Status] Update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update exchange status" },
      { status: 500 }
    );
  }
}
