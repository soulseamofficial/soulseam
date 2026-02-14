import crypto from "crypto";
import Order from "@/app/models/Order";

/**
 * Structured logger for payment operations
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {Object} context - Context object with orderId, razorpayOrderId, paymentId, source
 */
function logPayment(level, message, context = {}) {
  const { orderId, razorpayOrderId, paymentId, source, ...rest } = context;
  const logData = {
    timestamp: new Date().toISOString(),
    service: "razorpay",
    message,
    context: {
      orderId: orderId ? String(orderId) : undefined,
      razorpayOrderId,
      paymentId,
      source: source || "unknown",
      ...rest,
    },
  };

  if (level === "error") {
    console.error(`[PAYMENT] ${message}`, logData);
  } else if (level === "warn") {
    console.warn(`[PAYMENT] ${message}`, logData);
  } else {
    console.log(`[PAYMENT] ${message}`, logData);
  }
}

/**
 * Verify Razorpay payment signature
 * @param {string} razorpay_order_id - Razorpay order ID
 * @param {string} razorpay_payment_id - Razorpay payment ID
 * @param {string} razorpay_signature - Razorpay signature to verify
 * @returns {boolean} - True if signature is valid, false otherwise
 */
export function verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!secret) {
    logPayment("error", "RAZORPAY_KEY_SECRET is not configured", {
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
    return false;
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(razorpay_signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

/**
 * Mark order as paid with idempotency protection and atomic update
 * 
 * PRODUCTION-GRADE: Uses single atomic findOneAndUpdate to prevent race conditions.
 * Includes CRITICAL fraud protection: payment amount validation.
 * Assumes database connection is already established (called from API routes).
 * 
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string|null} razorpaySignature - Razorpay signature (null for webhooks)
 * @param {Object} options - Additional options
 * @param {boolean} options.isWebhook - Whether this is called from webhook (backup mode)
 * @param {number} options.paymentAmount - Payment amount in rupees (for validation)
 * @param {number} options.paymentAmountInPaise - Payment amount in paise (for validation)
 * @returns {Object} - { success: boolean, alreadyProcessed: boolean, order: Order | null, error?: string }
 */
export async function markOrderAsPaid(razorpayOrderId, razorpayPaymentId, razorpaySignature, options = {}) {
  const { isWebhook = false, paymentAmount, paymentAmountInPaise } = options;
  const source = isWebhook ? "webhook" : "verify_endpoint";

  try {
    // STEP 1: Fetch order first to validate payment amount (CRITICAL FRAUD PROTECTION)
    const existingOrder = await Order.findOne({ razorpayOrderId }).lean();
    
    if (!existingOrder) {
      logPayment("error", "Order not found", {
        razorpayOrderId,
        paymentId: razorpayPaymentId,
        source,
      });
      return {
        success: false,
        alreadyProcessed: false,
        order: null,
        error: "ORDER_NOT_FOUND",
      };
    }

    // STEP 2: CRITICAL FRAUD PROTECTION - Validate payment amount
    // Only validate if payment amount is provided (from verify endpoint or webhook)
    if (paymentAmount !== undefined || paymentAmountInPaise !== undefined) {
      const orderAmountInRupees = existingOrder.totalAmount;
      const orderAmountInPaise = Math.round(orderAmountInRupees * 100);
      
      // Use paise for comparison if available (more precise), otherwise use rupees
      let paymentAmountToCompare = null;
      if (paymentAmountInPaise !== undefined) {
        paymentAmountToCompare = paymentAmountInPaise;
      } else if (paymentAmount !== undefined) {
        paymentAmountToCompare = Math.round(paymentAmount * 100);
      }

      if (paymentAmountToCompare !== null && paymentAmountToCompare !== orderAmountInPaise) {
        // CRITICAL FRAUD ALERT: Amount mismatch
        logPayment("error", "CRITICAL FRAUD ALERT: Payment amount mismatch", {
          orderId: existingOrder._id.toString(),
          orderNumber: existingOrder.orderNumber,
          razorpayOrderId,
          paymentId: razorpayPaymentId,
          orderAmountInRupees: orderAmountInRupees,
          orderAmountInPaise: orderAmountInPaise,
          paymentAmountInRupees: paymentAmount,
          paymentAmountInPaise: paymentAmountInPaise,
          mismatch: Math.abs(paymentAmountToCompare - orderAmountInPaise),
          source,
        });
        
        // DO NOT mark order as paid - this is a fraud attempt
        return {
          success: false,
          alreadyProcessed: false,
          order: existingOrder,
          error: "AMOUNT_MISMATCH",
        };
      }
    }

    // STEP 3: Check if already paid (idempotency check before atomic update)
    if (existingOrder.paymentStatus === "PAID") {
      // Check if paid with same payment ID (idempotent success)
      if (existingOrder.razorpayPaymentId === razorpayPaymentId) {
        logPayment("info", "Payment already processed (idempotent)", {
          orderId: existingOrder._id.toString(),
          orderNumber: existingOrder.orderNumber,
          razorpayOrderId,
          paymentId: razorpayPaymentId,
          source,
        });
        // Note: Revenue event already logged when payment was first processed
        return {
          success: true,
          alreadyProcessed: true,
          order: existingOrder,
          message: "Payment already processed",
        };
      }

      // Check if paid with different payment ID (suspicious)
      if (existingOrder.razorpayPaymentId !== razorpayPaymentId) {
        logPayment("warn", "Order already paid with different payment ID", {
          orderId: existingOrder._id.toString(),
          orderNumber: existingOrder.orderNumber,
          razorpayOrderId,
          existingPaymentId: existingOrder.razorpayPaymentId,
          newPaymentId: razorpayPaymentId,
          source,
        });
        return {
          success: false,
          alreadyProcessed: true,
          order: existingOrder,
          error: "PAYMENT_ID_MISMATCH",
        };
      }
    }

    // STEP 4: ATOMIC UPDATE - Single findOneAndUpdate with conditions
    // This prevents race conditions by only updating if paymentStatus is NOT "PAID"
    // Database-level unique index on razorpayPaymentId prevents duplicate payments
    const now = new Date();
    
    // Build update object
    const updateData = {
      paymentStatus: "PAID",
      orderStatus: "CONFIRMED",
      razorpayPaymentId: razorpayPaymentId,
      paidAt: now,
      // Legacy fields for backward compatibility
      "payment.status": "paid",
      "payment.razorpayPaymentId": razorpayPaymentId,
      legacyOrderStatus: "paid",
    };

    // Only set signature if provided (not for webhooks)
    if (razorpaySignature) {
      updateData.razorpaySignature = razorpaySignature;
    }

    // CRITICAL: Atomic update - only succeeds if paymentStatus is NOT "PAID"
    // This single operation prevents race conditions
    const updateResult = await Order.findOneAndUpdate(
      {
        razorpayOrderId: razorpayOrderId,
        paymentStatus: { $ne: "PAID" }, // Only update if not already paid
      },
      {
        $set: updateData,
      },
      {
        new: true, // Return updated document
        runValidators: true,
      }
    );

    // If updateResult is null, order was already paid (race condition handled)
    // This should rarely happen since we check before update, but handle gracefully
    if (!updateResult) {
      // Re-fetch to get latest state
      const latestOrder = await Order.findOne({ razorpayOrderId }).lean();
      
      if (!latestOrder) {
        logPayment("error", "Order not found after update attempt", {
          razorpayOrderId,
          paymentId: razorpayPaymentId,
          source,
        });
        return {
          success: false,
          alreadyProcessed: false,
          order: null,
          error: "ORDER_NOT_FOUND",
        };
      }

      // Check if now paid (race condition - another request processed it)
      if (latestOrder.paymentStatus === "PAID") {
        if (latestOrder.razorpayPaymentId === razorpayPaymentId) {
          logPayment("info", "Payment processed by concurrent request (idempotent)", {
            orderId: latestOrder._id.toString(),
            orderNumber: latestOrder.orderNumber,
            razorpayOrderId,
            paymentId: razorpayPaymentId,
            source,
          });
          // Note: Revenue event already logged when payment was first processed
          return {
            success: true,
            alreadyProcessed: true,
            order: latestOrder,
            message: "Payment already processed",
          };
        } else {
          logPayment("warn", "Order paid with different payment ID (race condition)", {
            orderId: latestOrder._id.toString(),
            orderNumber: latestOrder.orderNumber,
            razorpayOrderId,
            existingPaymentId: latestOrder.razorpayPaymentId,
            newPaymentId: razorpayPaymentId,
            source,
          });
          return {
            success: false,
            alreadyProcessed: true,
            order: latestOrder,
            error: "PAYMENT_ID_MISMATCH",
          };
        }
      }

      // Order exists but in unexpected state
      logPayment("error", "Order in unexpected state after update attempt", {
        orderId: latestOrder._id.toString(),
        orderNumber: latestOrder.orderNumber,
        razorpayOrderId,
        paymentId: razorpayPaymentId,
        paymentStatus: latestOrder.paymentStatus,
        source,
      });
      return {
        success: false,
        alreadyProcessed: false,
        order: latestOrder,
        error: "UPDATE_FAILED",
      };
    }

    // Success: Payment marked as paid atomically
    logPayment("info", "Payment marked as paid successfully", {
      orderId: updateResult._id.toString(),
      orderNumber: updateResult.orderNumber,
      razorpayOrderId,
      paymentId: razorpayPaymentId,
      source,
    });

    // 🚨 REVENUE MONITORING LOG - Makes revenue traceable instantly
    console.log("💰 REVENUE EVENT", {
      orderNumber: updateResult.orderNumber,
      amount: updateResult.totalAmount,
      paymentId: razorpayPaymentId,
      orderId: updateResult._id.toString(),
      razorpayOrderId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      alreadyProcessed: false,
      order: updateResult,
      message: "Payment processed successfully",
    };
  } catch (error) {
    // Handle duplicate key error (unique index on razorpayPaymentId)
    if (error.code === 11000 && error.keyPattern?.razorpayPaymentId) {
      logPayment("warn", "Duplicate payment detected (database-level protection)", {
        razorpayOrderId,
        paymentId: razorpayPaymentId,
        source,
        error: error.message,
      });
      
      // Fetch order to return idempotent success
      const existingOrder = await Order.findOne({ razorpayOrderId }).lean();
      if (existingOrder?.paymentStatus === "PAID") {
        // Note: Revenue event already logged when payment was first processed
        return {
          success: true,
          alreadyProcessed: true,
          order: existingOrder,
          message: "Payment already processed (duplicate prevented)",
        };
      }
    }

    logPayment("error", "Error marking order as paid", {
      razorpayOrderId,
      paymentId: razorpayPaymentId,
      source,
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      alreadyProcessed: false,
      order: null,
      error: error.message || "UNKNOWN_ERROR",
    };
  }
}
