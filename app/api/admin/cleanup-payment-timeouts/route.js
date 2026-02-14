import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { requireAdminAuth } from "@/app/lib/adminAuth";

/**
 * Structured logger for payment timeout cleanup job
 */
function logCleanup(level, message, context = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    service: "cleanup_payment_timeouts",
    message,
    context,
  };

  if (level === "error") {
    console.error(`[CLEANUP] ${message}`, logData);
  } else if (level === "warn") {
    console.warn(`[CLEANUP] ${message}`, logData);
  } else {
    console.log(`[CLEANUP] ${message}`, logData);
  }
}

/**
 * POST /api/admin/cleanup-payment-timeouts
 * 
 * Background cleanup job to cancel orders that have been pending payment for too long.
 * 
 * This endpoint:
 * 1. Finds orders where:
 *    - paymentStatus = "PENDING"
 *    - orderStatus = "CREATED"
 *    - createdAt older than 20 minutes (default, configurable)
 * 2. Updates them to:
 *    - orderStatus = "CANCELLED"
 *    - Adds cancellation reason
 * 
 * Can be called:
 * - Manually by admin
 * - Via cron job (e.g., every 5 minutes)
 * - Via scheduled task
 * 
 * Query params:
 * - timeoutMinutes: Minutes after which to cancel pending orders (default: 20)
 * - limit: Max number of orders to process per run (default: 100)
 */
export async function POST(req) {
  try {
    // Verify admin authentication
    const { authorized, error } = await requireAdminAuth(req);
    
    if (!authorized) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const timeoutMinutes = parseInt(searchParams.get("timeoutMinutes") || "20", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    logCleanup("info", "Starting payment timeout cleanup", {
      timeoutMinutes,
      limit,
    });

    // Calculate cutoff time (orders created before this time should be cancelled)
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    // Find orders that match the criteria
    const pendingOrders = await Order.find({
      paymentStatus: "PENDING",
      orderStatus: "CREATED",
      createdAt: { $lt: cutoffTime }, // Created before cutoff time
    })
      .sort({ createdAt: 1 }) // Process oldest first
      .limit(limit)
      .lean();

    if (pendingOrders.length === 0) {
      logCleanup("info", "No pending orders to cancel");
      return NextResponse.json({
        success: true,
        cancelled: 0,
        message: "No pending orders to cancel",
      });
    }

    logCleanup("info", "Found pending orders to cancel", {
      count: pendingOrders.length,
    });

    let cancelled = 0;
    let failed = 0;

    // Process each pending order
    for (const order of pendingOrders) {
      try {
        // Update order to CANCELLED status with reason
        const updateResult = await Order.findByIdAndUpdate(
          order._id,
          {
            $set: {
              orderStatus: "CANCELLED",
              cancellationReason: "Payment timeout",
            },
          },
          { new: true }
        );

        if (updateResult) {
          logCleanup("info", "Order cancelled due to payment timeout", {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            razorpayOrderId: order.razorpayOrderId,
            createdAt: order.createdAt,
            ageMinutes: Math.round((Date.now() - new Date(order.createdAt).getTime()) / (60 * 1000)),
          });
          cancelled++;
        } else {
          logCleanup("warn", "Failed to cancel order (update returned null)", {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
          });
          failed++;
        }
      } catch (error) {
        logCleanup("error", "Error cancelling order", {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          error: error.message,
          stack: error.stack,
        });
        failed++;
      }
    }

    logCleanup("info", "Payment timeout cleanup completed", {
      total: pendingOrders.length,
      cancelled,
      failed,
    });

    return NextResponse.json({
      success: true,
      cancelled,
      failed,
      total: pendingOrders.length,
      message: `Cancelled ${cancelled} orders due to payment timeout`,
    });
  } catch (error) {
    logCleanup("error", "Cleanup job error", {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error.message || "An error occurred during cleanup",
      },
      { status: 500 }
    );
  }
}
