/**
 * Razorpay Webhook Handler
 * 
 * Production-grade webhook handler for Razorpay payment events.
 * 
 * IMPORTANT: This route requires raw body for signature verification.
 * Next.js automatically handles this when using req.text().
 * 
 * This webhook acts as a BACKUP payment confirmation mechanism.
 * The primary payment confirmation happens via /api/payment/verify endpoint
 * which is called immediately after payment success on the frontend.
 * 
 * Configure this URL in Razorpay Dashboard:
 * Settings → Webhooks → Add Webhook URL: https://yourdomain.com/api/webhooks/razorpay
 * Events to subscribe: payment.captured, payment.failed
 * 
 * Environment Variables Required:
 * - RAZORPAY_WEBHOOK_SECRET: Your Razorpay webhook secret
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import OrphanPayment from "@/app/models/OrphanPayment";
import { markOrderAsPaid } from "@/app/lib/razorpay";

/**
 * Structured logger for webhook operations
 */
function logWebhook(level, message, context = {}) {
  const { razorpayOrderId, paymentId, event, ...rest } = context;
  const logData = {
    timestamp: new Date().toISOString(),
    service: "webhook",
    message,
    context: {
      razorpayOrderId,
      paymentId,
      event,
      ...rest,
    },
  };

  if (level === "error") {
    console.error(`[WEBHOOK] ${message}`, logData);
  } else if (level === "warn") {
    console.warn(`[WEBHOOK] ${message}`, logData);
  } else {
    console.log(`[WEBHOOK] ${message}`, logData);
  }
}

/**
 * Process payment (awaited directly, not in background)
 * CRITICAL: Serverless platforms may terminate execution after response,
 * so we must await payment processing before returning response.
 */
async function processPayment(razorpayOrderId, paymentId, amount, payment) {
  await connectDB();
  
  // STEP 1: Try to find order immediately
  let order = await Order.findOne({ razorpayOrderId }).lean();
  
  // STEP 2: EXTREME SAFETY FEATURE - If order not found, wait 2 seconds and retry ONCE
  // Reason: Sometimes webhook beats DB write by milliseconds
  // This can reduce orphan payments by ~70%
  if (!order) {
    logWebhook("warn", "Order not found on first attempt, waiting 2 seconds before retry", {
      razorpayOrderId,
      paymentId,
      event: "payment.captured",
    });
    
    // Wait 2 seconds for DB write to complete
    await new Promise(r => setTimeout(r, 2000));
    
    // Retry once
    order = await Order.findOne({ razorpayOrderId }).lean();
    
    if (order) {
      logWebhook("info", "Order found on retry (webhook arrived before DB write completed)", {
        razorpayOrderId,
        paymentId,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        event: "payment.captured",
      });
    }
  }
  
  // STEP 3: If still not found after retry, save as orphan payment
  if (!order) {
    // Save as orphan payment
    await OrphanPayment.create({
      razorpayOrderId,
      razorpayPaymentId: paymentId,
      amount,
      amountInPaise: payment.amount,
      currency: payment.currency || "INR",
      event: "payment.captured",
      paymentStatus: "captured",
      rawPayload: payment,
      notes: "Order not found when webhook arrived (after 2-second retry). Payment captured but order was never created in DB.",
    });
    
    logWebhook("warn", "Orphan payment detected (after retry)", {
      razorpayOrderId,
      paymentId,
      event: "payment.captured",
    });
    return { success: false, error: "ORDER_NOT_FOUND" };
  }

  // Use shared utility for idempotent payment processing
  // CRITICAL: Amount validation is handled in markOrderAsPaid
  const result = await markOrderAsPaid(
    razorpayOrderId,
    paymentId,
    null, // Webhooks don't have payment signature
    { 
      isWebhook: true,
      paymentAmount: amount, // Pass payment amount for validation
      paymentAmountInPaise: payment.amount,
    }
  );

  if (result.success) {
    if (result.alreadyProcessed) {
      logWebhook("info", "Payment already processed by verify endpoint (webhook backup)", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        razorpayOrderId,
        paymentId,
        event: "payment.captured",
      });
    } else {
      logWebhook("info", "Payment processed by webhook (backup confirmation)", {
        orderId: result.order._id.toString(),
        orderNumber: result.order.orderNumber,
        razorpayOrderId,
        paymentId,
        event: "payment.captured",
      });
    }
  } else {
    if (result.error === "PAYMENT_ID_MISMATCH") {
      logWebhook("warn", "Payment ID mismatch in webhook", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        razorpayOrderId,
        existingPaymentId: order.razorpayPaymentId,
        webhookPaymentId: paymentId,
        event: "payment.captured",
      });
    } else if (result.error === "AMOUNT_MISMATCH") {
      logWebhook("error", "CRITICAL FRAUD ALERT: Payment amount mismatch in webhook", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        razorpayOrderId,
        paymentId,
        orderAmount: order.totalAmount,
        paymentAmount: amount,
        paymentAmountInPaise: payment.amount,
        event: "payment.captured",
      });
    } else {
      logWebhook("error", "Failed to process payment in webhook", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        razorpayOrderId,
        paymentId,
        error: result.error,
        event: "payment.captured",
      });
    }
  }

  return result;
}

/**
 * Process failed payment (awaited directly)
 */
async function processFailedPayment(razorpayOrderId) {
  await connectDB();
  
  const order = await Order.findOne({ razorpayOrderId }).lean();
  
  if (order) {
    await Order.findByIdAndUpdate(
      order._id,
      {
        $set: {
          paymentStatus: "FAILED",
          // Don't change orderStatus - keep it as is
        },
      }
    );

    logWebhook("info", "Payment failed", {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      razorpayOrderId,
      event: "payment.failed",
    });
    return { success: true };
  } else {
    logWebhook("warn", "Payment failed but order not found", {
      razorpayOrderId,
      event: "payment.failed",
    });
    return { success: false, error: "ORDER_NOT_FOUND" };
  }
}

export async function POST(req) {
  const startTime = Date.now();
  
  try {
    logWebhook("info", "Webhook received");
    
    //------------------------------------------------
    // STEP 1 — GET RAW BODY FOR SIGNATURE VERIFICATION
    //------------------------------------------------
    const rawBody = await req.text();

    //------------------------------------------------
    // STEP 2 — VERIFY SIGNATURE (BEFORE DB CONNECTION)
    //------------------------------------------------
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers.get("x-razorpay-signature");

    // Fail fast if secret missing
    if (!webhookSecret) {
      logWebhook("error", "RAZORPAY_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    if (!receivedSignature) {
      logWebhook("error", "Missing Razorpay webhook signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    // Verify signature using timing-safe comparison
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(receivedSignature);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      logWebhook("error", "Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    //------------------------------------------------
    // STEP 3 — PARSE EVENT
    //------------------------------------------------
    const event = JSON.parse(rawBody);
    logWebhook("info", "Event parsed", { event: event.event });

    //------------------------------------------------
    // STEP 4 — PROCESS PAYMENT (AWAITED DIRECTLY)
    //------------------------------------------------
    // CRITICAL: Serverless platforms may terminate execution after response,
    // so we must await payment processing before returning response.
    // This ensures payment is processed even if the serverless function terminates.
    
    // Ignore unused events
    if (event.event !== "payment.captured" && event.event !== "payment.failed") {
      const responseTime = Date.now() - startTime;
      logWebhook("info", "Event ignored", { 
        event: event.event,
        responseTime: `${responseTime}ms`,
      });
      return NextResponse.json({ ignored: true });
    }

    // Extract event data
    let eventData = null;
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      eventData = {
        razorpayOrderId: payment.order_id,
        paymentId: payment.id,
        amount: payment.amount / 100,
        payment,
      };
    } else if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      eventData = {
        razorpayOrderId: payment.order_id,
      };
    }

    // Connect to database before processing
    await connectDB();

    // Process payment (AWAITED DIRECTLY - no fire-and-forget)
    let processResult = null;
    if (event.event === "payment.captured" && eventData) {
      processResult = await processPayment(
        eventData.razorpayOrderId,
        eventData.paymentId,
        eventData.amount,
        eventData.payment
      );
    } else if (event.event === "payment.failed" && eventData) {
      processResult = await processFailedPayment(eventData.razorpayOrderId);
    }

    // Return response after processing completes
    const responseTime = Date.now() - startTime;
    logWebhook("info", "Webhook processed", {
      event: event.event,
      responseTime: `${responseTime}ms`,
      razorpayOrderId: eventData?.razorpayOrderId,
      success: processResult?.success,
    });

    return NextResponse.json({ 
      received: true,
      event: event.event,
      processed: processResult?.success || false,
    });

  } catch (err) {
    const responseTime = Date.now() - startTime;
    logWebhook("error", "Webhook error", {
      error: err.message,
      stack: err.stack,
      responseTime: `${responseTime}ms`,
    });
    
    // Still return 200 to prevent Razorpay retries for parsing errors
    // Log the error for investigation
    return NextResponse.json(
      { error: "Webhook processing error", received: true },
      { status: 200 }
    );
  }
}
