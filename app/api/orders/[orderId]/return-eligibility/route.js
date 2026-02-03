import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import Order from "@/app/models/Order";

export async function GET(req, { params }) {
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

    return NextResponse.json({
      success: true,
      eligible: eligibility.eligible,
      reason: eligibility.reason,
      returnDeadline: eligibility.returnDeadline,
      daysRemaining: eligibility.daysRemaining,
    });
  } catch (error) {
    console.error("[Return Eligibility] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check return eligibility" },
      { status: 500 }
    );
  }
}

/**
 * Calculate return eligibility based on order status and delivery date
 * @param {Object} order - Order document
 * @returns {Object} Eligibility information
 */
export function calculateReturnEligibility(order) {
  // Edge case 1: Guest orders → no return
  if (!order.userId && order.guestUserId) {
    return {
      eligible: false,
      reason: "Guest orders are not eligible for returns",
      returnDeadline: null,
      daysRemaining: 0,
    };
  }

  // Edge case 2: Order not delivered
  if (order.orderStatus !== "DELIVERED") {
    return {
      eligible: false,
      reason: "Order must be delivered before requesting a return",
      returnDeadline: null,
      daysRemaining: 0,
    };
  }

  // Edge case 3: Order cancelled or failed
  if (order.orderStatus === "CANCELLED" || order.paymentStatus === "FAILED") {
    return {
      eligible: false,
      reason: "Cancelled or failed orders are not eligible for returns",
      returnDeadline: null,
      daysRemaining: 0,
    };
  }

  // Edge case 4: Already returned
  if (order.returnRequested && order.returnStatus === "COMPLETED") {
    return {
      eligible: false,
      reason: "This order has already been returned",
      returnDeadline: null,
      daysRemaining: 0,
    };
  }

  // Check if deliveredAt is set
  if (!order.deliveredAt) {
    return {
      eligible: false,
      reason: "Delivery date not recorded. Please contact support.",
      returnDeadline: null,
      daysRemaining: 0,
    };
  }

  // Calculate days since delivery
  const deliveredDate = new Date(order.deliveredAt);
  const currentDate = new Date();
  const daysSinceDelivery = Math.floor(
    (currentDate - deliveredDate) / (1000 * 60 * 60 * 24)
  );

  // Calculate return deadline (7 days from delivery)
  const returnDeadline = new Date(deliveredDate);
  returnDeadline.setDate(returnDeadline.getDate() + 7);

  // Check if within 7-day window
  if (daysSinceDelivery > 7) {
    return {
      eligible: false,
      reason: "Return period has expired",
      returnDeadline: returnDeadline.toISOString(),
      daysRemaining: 0,
    };
  }

  // If return already requested, check status
  if (order.returnRequested) {
    if (order.returnStatus === "REQUESTED") {
      return {
        eligible: false,
        reason: "Return request is already pending",
        returnDeadline: returnDeadline.toISOString(),
        daysRemaining: Math.max(0, 7 - daysSinceDelivery),
      };
    }
    if (order.returnStatus === "APPROVED") {
      return {
        eligible: false,
        reason: "Return request has been approved",
        returnDeadline: returnDeadline.toISOString(),
        daysRemaining: Math.max(0, 7 - daysSinceDelivery),
      };
    }
    if (order.returnStatus === "REJECTED") {
      return {
        eligible: false,
        reason: "Return request has been rejected",
        returnDeadline: returnDeadline.toISOString(),
        daysRemaining: Math.max(0, 7 - daysSinceDelivery),
      };
    }
  }

  // Eligible for return
  return {
    eligible: true,
    reason: null,
    returnDeadline: returnDeadline.toISOString(),
    daysRemaining: Math.max(0, 7 - daysSinceDelivery),
  };
}
