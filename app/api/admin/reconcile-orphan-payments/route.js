import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import OrphanPayment from "@/app/models/OrphanPayment";
import { markOrderAsPaid } from "@/app/lib/razorpay";
import { requireAdminAuth } from "@/app/lib/adminAuth";

/**
 * Structured logger for reconciliation job
 */
function logReconcile(level, message, context = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    service: "reconcile",
    message,
    context,
  };

  if (level === "error") {
    console.error(`[RECONCILE] ${message}`, logData);
  } else if (level === "warn") {
    console.warn(`[RECONCILE] ${message}`, logData);
  } else {
    console.log(`[RECONCILE] ${message}`, logData);
  }
}

/**
 * POST /api/admin/reconcile-orphan-payments
 * 
 * Background reconciliation job to recover orphan payments.
 * 
 * This endpoint:
 * 1. Scans OrphanPayment collection for unprocessed payments
 * 2. Matches using razorpayOrderId
 * 3. If order exists, marks as PAID and deletes orphan record
 * 4. Includes retry limits and logging
 * 
 * Can be called:
 * - Manually by admin
 * - Via cron job (e.g., every 5 minutes)
 * - Via scheduled task
 * 
 * Query params:
 * - limit: Max number of orphan payments to process (default: 50)
 * - maxRetries: Max retry attempts per orphan payment (default: 3)
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
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const maxRetries = parseInt(searchParams.get("maxRetries") || "3", 10);

    logReconcile("info", "Starting orphan payment reconciliation", {
      limit,
      maxRetries,
    });

    // Find unprocessed orphan payments (not processed and retry count < maxRetries)
    const orphanPayments = await OrphanPayment.find({
      processed: false,
      $or: [
        { retryCount: { $exists: false } },
        { retryCount: { $lt: maxRetries } },
      ],
    })
      .sort({ createdAt: 1 }) // Process oldest first
      .limit(limit)
      .lean();

    if (orphanPayments.length === 0) {
      logReconcile("info", "No orphan payments to reconcile");
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No orphan payments to reconcile",
      });
    }

    logReconcile("info", "Found orphan payments to reconcile", {
      count: orphanPayments.length,
    });

    let processed = 0;
    let failed = 0;
    let notFound = 0;

    // Process each orphan payment
    for (const orphan of orphanPayments) {
      try {
        // Find order by razorpayOrderId
        const order = await Order.findOne({ razorpayOrderId: orphan.razorpayOrderId }).lean();

        if (!order) {
          // Order still doesn't exist - increment retry count
          const retryCount = (orphan.retryCount || 0) + 1;
          await OrphanPayment.findByIdAndUpdate(orphan._id, {
            $set: { retryCount },
          });

          if (retryCount >= maxRetries) {
            logReconcile("warn", "Orphan payment exceeded max retries", {
              orphanId: orphan._id.toString(),
              razorpayOrderId: orphan.razorpayOrderId,
              paymentId: orphan.razorpayPaymentId,
              retryCount,
            });
          } else {
            logReconcile("info", "Order not found yet, will retry", {
              orphanId: orphan._id.toString(),
              razorpayOrderId: orphan.razorpayOrderId,
              retryCount,
            });
          }
          notFound++;
          continue;
        }

        // Order found - try to mark as paid
        const result = await markOrderAsPaid(
          orphan.razorpayOrderId,
          orphan.razorpayPaymentId,
          null, // No signature for orphan payments
          { isWebhook: true }
        );

        if (result.success) {
          // Success - mark orphan as processed and delete it
          await OrphanPayment.findByIdAndDelete(orphan._id);

          logReconcile("info", "Orphan payment reconciled successfully", {
            orphanId: orphan._id.toString(),
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            razorpayOrderId: orphan.razorpayOrderId,
            paymentId: orphan.razorpayPaymentId,
            alreadyProcessed: result.alreadyProcessed,
          });

          processed++;
        } else {
          // Failed to mark as paid - increment retry count
          const retryCount = (orphan.retryCount || 0) + 1;
          await OrphanPayment.findByIdAndUpdate(orphan._id, {
            $set: { retryCount },
          });

          logReconcile("warn", "Failed to reconcile orphan payment", {
            orphanId: orphan._id.toString(),
            orderId: order._id.toString(),
            razorpayOrderId: orphan.razorpayOrderId,
            paymentId: orphan.razorpayPaymentId,
            error: result.error,
            retryCount,
          });

          failed++;
        }
      } catch (error) {
        // Increment retry count on error
        const retryCount = (orphan.retryCount || 0) + 1;
        await OrphanPayment.findByIdAndUpdate(orphan._id, {
          $set: { retryCount },
        });

        logReconcile("error", "Error processing orphan payment", {
          orphanId: orphan._id.toString(),
          razorpayOrderId: orphan.razorpayOrderId,
          paymentId: orphan.razorpayPaymentId,
          error: error.message,
          retryCount,
        });

        failed++;
      }
    }

    logReconcile("info", "Orphan payment reconciliation completed", {
      total: orphanPayments.length,
      processed,
      failed,
      notFound,
    });

    return NextResponse.json({
      success: true,
      processed,
      failed,
      notFound,
      total: orphanPayments.length,
      message: `Reconciled ${processed} orphan payments`,
    });
  } catch (error) {
    logReconcile("error", "Reconciliation job error", {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error.message || "An error occurred during reconciliation",
      },
      { status: 500 }
    );
  }
}
