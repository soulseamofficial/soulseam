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

    // Check exchange eligibility
    const eligibility = calculateExchangeEligibility(order);

    return NextResponse.json({
      success: true,
      eligible: eligibility.eligible,
      reason: eligibility.reason,
      exchangeDeadline: eligibility.exchangeDeadline,
      daysRemaining: eligibility.daysRemaining,
    });
  } catch (error) {
    console.error("[Exchange Eligibility] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check exchange eligibility" },
      { status: 500 }
    );
  }
}

/**
 * Calculate exchange eligibility based on order status and delivery date
 * @param {Object} order - Order document
 * @returns {Object} Eligibility information
 */
export function calculateExchangeEligibility(order) {
  // Edge case 1: Order not delivered
  if (order.orderStatus !== "DELIVERED") {
    return {
      eligible: false,
      reason: "Order must be delivered before requesting an exchange",
      exchangeDeadline: null,
      daysRemaining: 0,
    };
  }

  // Edge case 2: Order cancelled or failed
  if (order.orderStatus === "CANCELLED" || order.paymentStatus === "FAILED") {
    return {
      eligible: false,
      reason: "Cancelled or failed orders are not eligible for exchange",
      exchangeDeadline: null,
      daysRemaining: 0,
    };
  }

  // Edge case 3: Already exchanged
  if (order.exchangeRequested && order.exchangeStatus === "COMPLETED") {
    return {
      eligible: false,
      reason: "This order has already been exchanged",
      exchangeDeadline: null,
      daysRemaining: 0,
    };
  }

  // Check if deliveredAt is set
  if (!order.deliveredAt) {
    return {
      eligible: false,
      reason: "Delivery date not recorded. Please contact support.",
      exchangeDeadline: null,
      daysRemaining: 0,
    };
  }

  // Calculate days since delivery
  const deliveredDate = new Date(order.deliveredAt);
  const currentDate = new Date();
  const daysSinceDelivery = Math.floor(
    (currentDate - deliveredDate) / (1000 * 60 * 60 * 24)
  );

  // Calculate exchange deadline (3 days from delivery)
  const exchangeDeadline = new Date(deliveredDate);
  exchangeDeadline.setDate(exchangeDeadline.getDate() + 3);

  // Check if within 3-day window
  if (daysSinceDelivery > 3) {
    return {
      eligible: false,
      reason: "Exchange period has expired (3 days from delivery)",
      exchangeDeadline: exchangeDeadline.toISOString(),
      daysRemaining: 0,
    };
  }

  // If exchange already requested, check status
  if (order.exchangeRequested) {
    if (order.exchangeStatus === "REQUESTED") {
      return {
        eligible: false,
        reason: "Exchange request is already pending",
        exchangeDeadline: exchangeDeadline.toISOString(),
        daysRemaining: Math.max(0, 3 - daysSinceDelivery),
      };
    }
    if (order.exchangeStatus === "APPROVED") {
      return {
        eligible: false,
        reason: "Exchange request has been approved",
        exchangeDeadline: exchangeDeadline.toISOString(),
        daysRemaining: Math.max(0, 3 - daysSinceDelivery),
      };
    }
    if (order.exchangeStatus === "REJECTED") {
      return {
        eligible: false,
        reason: "Exchange request has been rejected",
        exchangeDeadline: exchangeDeadline.toISOString(),
        daysRemaining: Math.max(0, 3 - daysSinceDelivery),
      };
    }
  }

  // Eligible for exchange
  return {
    eligible: true,
    reason: null,
    exchangeDeadline: exchangeDeadline.toISOString(),
    daysRemaining: Math.max(0, 3 - daysSinceDelivery),
  };
}
