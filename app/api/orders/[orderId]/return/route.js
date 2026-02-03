import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import Order from "@/app/models/Order";
import { calculateReturnEligibility } from "../return-eligibility/route";

export async function POST(req, { params }) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const user = await getAuthUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find order and verify ownership
    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { userId: user._id },
        { guestUserId: user._id }
      ]
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check return eligibility
    const eligibility = calculateReturnEligibility(order);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason || "Order is not eligible for return",
        },
        { status: 400 }
      );
    }

    // Check if return already requested
    if (order.returnRequested && order.returnStatus === "REQUESTED") {
      return NextResponse.json(
        {
          success: false,
          error: "Return request already submitted",
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { returnReason, returnVideoUrl } = body;

    // Validate required fields
    if (!returnVideoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Return video is required",
        },
        { status: 400 }
      );
    }

    if (!returnReason || returnReason.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Return reason is required",
        },
        { status: 400 }
      );
    }

    // Create return request
    const updateData = {
      returnRequested: true,
      returnRequestedAt: new Date(),
      returnStatus: "REQUESTED",
      returnReason: returnReason.trim(),
      returnVideoUrl: returnVideoUrl,
    };

    await Order.findByIdAndUpdate(orderId, { $set: updateData });

    return NextResponse.json({
      success: true,
      message: "Return request submitted successfully",
      returnStatus: "REQUESTED",
    });
  } catch (error) {
    console.error("[Return Request] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit return request" },
      { status: 500 }
    );
  }
}
