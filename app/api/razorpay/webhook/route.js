/**
 * Razorpay Webhook Handler
 * 
 * This route handles Razorpay payment webhook events.
 * When a payment is successful, it updates the order and sends it to Delhivery.
 * 
 * Configure this URL in Razorpay Dashboard:
 * Settings → Webhooks → Add Webhook URL: https://yourdomain.com/api/razorpay/webhook
 * Events to subscribe: payment.captured, payment.failed
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import OrphanPayment from "@/app/models/OrphanPayment";
import User from "@/app/models/User";
import Coupon from "@/app/models/coupon";
// Shipment creation moved to admin panel - removed from webhook

/**
 * Verifies Razorpay webhook signature
 */
function verifyWebhookSignature(payload, signature, secret) {
  if (!secret) return false;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return expectedSignature === signature;
}

export async function POST(req) {
  try {
    await connectDB();

    // Get raw body for signature verification
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers.get("x-razorpay-signature");

    if (!webhookSecret) {
      console.warn("⚠️ RAZORPAY_WEBHOOK_SECRET not configured. Webhook verification skipped.");
    } else if (!signature) {
      console.error("❌ Missing Razorpay webhook signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    } else {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("❌ Invalid Razorpay webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Handle webhook event
    const event = body.event;
    const paymentEntity = body.payload?.payment?.entity || body.payload?.payment;

    if (!event || !paymentEntity) {
      console.error("❌ Invalid webhook payload:", body);
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    console.log("📥 Razorpay webhook received:", {
      event,
      paymentId: paymentEntity.id,
      orderId: paymentEntity.order_id,
      status: paymentEntity.status,
    });

    // Handle payment.captured event (payment successful)
    if (event === "payment.captured") {
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;
      const paymentStatus = paymentEntity.status;
      const amount = paymentEntity.amount || 0; // Amount in paise
      const amountInRupees = amount / 100;

      if (paymentStatus !== "captured") {
        console.log("⚠️ Payment not captured, status:", paymentStatus);
        return NextResponse.json({ received: true });
      }

      // Find order by Razorpay order ID
      console.log("🔍 WEBHOOK: Searching for order", {
        razorpayOrderId: razorpayOrderId,
        paymentMethod: "ONLINE",
      });
      
      const order = await Order.findOne({
        razorpayOrderId: razorpayOrderId,
      });

      // STEP 6: SAFETY NET - Handle orphan payments
      if (!order) {
        console.error("❌ WEBHOOK: Order not found for Razorpay order ID - Saving as orphan payment", {
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: razorpayPaymentId,
          paymentStatus: paymentStatus,
          amount: amountInRupees,
        });

        // Save to orphan_payments collection to prevent revenue loss
        try {
          await OrphanPayment.create({
            razorpayOrderId: razorpayOrderId,
            razorpayPaymentId: razorpayPaymentId,
            amount: amountInRupees,
            amountInPaise: amount,
            currency: paymentEntity.currency || "INR",
            event: event,
            paymentStatus: paymentStatus,
            rawPayload: paymentEntity,
            notes: "Order not found when webhook arrived. Payment captured but order was never created in DB.",
          });

          console.log("✅ Orphan payment saved to prevent revenue loss:", {
            razorpayOrderId: razorpayOrderId,
            razorpayPaymentId: razorpayPaymentId,
          });
        } catch (orphanError) {
          console.error("❌ Failed to save orphan payment:", orphanError);
        }

        return NextResponse.json({ 
          received: true, 
          message: "Order not found - saved as orphan payment" 
        });
      }
      
      console.log("✅ WEBHOOK: Order found", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        currentPaymentStatus: order.paymentStatus,
        currentOrderStatus: order.orderStatus,
      });

      // STEP 5: IDEMPOTENCY CHECK - Prevent duplicate webhook updates
      if (order.paymentStatus === "PAID") {
        console.log("✅ Order already paid (idempotency check):", {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
        });
        return NextResponse.json({ 
          received: true, 
          message: "Order already paid - duplicate webhook ignored",
          orderId: order._id.toString(),
        });
      }

      // Update order: payment PAID, order CONFIRMED, add payment details and timestamp
      await Order.findByIdAndUpdate(order._id, {
        $set: {
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED", // State machine: CREATED → CONFIRMED (not directly to "paid")
          razorpayPaymentId: razorpayPaymentId,
          razorpaySignature: paymentEntity.signature || null,
          paidAt: new Date(), // Payment timestamp
          // Legacy fields
          "payment.status": "paid",
          "payment.razorpayPaymentId": razorpayPaymentId,
          legacyOrderStatus: "paid",
        },
      });

      console.log("✅ Order updated to PAID and CONFIRMED:", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentId: razorpayPaymentId,
      });

      // Update user orderCount and firstOrderCouponUsed when order is confirmed (logged-in users only)
      // Only update if this is the first time the order is being confirmed
      if (order.userId && order.orderStatus !== "CONFIRMED") {
        try {
          const userUpdate = { $inc: { orderCount: 1 } };
          
          // If first-order coupon was used, mark it as used
          if (order.coupon?.code) {
            const couponDoc = await Coupon.findOne({ code: order.coupon.code.toUpperCase().trim() });
            if (couponDoc && couponDoc.isFirstOrderCoupon === true) {
              userUpdate.$set = { firstOrderCouponUsed: true };
            }
          }
          
          await User.findByIdAndUpdate(order.userId, userUpdate);
          console.log("✅ Updated user orderCount and firstOrderCouponUsed via webhook:", order.userId);
        } catch (userUpdateError) {
          // Log error but don't fail the webhook processing
          console.error("❌ Failed to update user orderCount via webhook (non-blocking):", userUpdateError);
        }
      }

      // Shipment creation is now handled by admin - removed from webhook flow
      // Order status: CONFIRMED → will be moved to PROCESSING by admin/worker later

      return NextResponse.json({ 
        received: true, 
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      });
    }

    // Handle payment.failed event
    if (event === "payment.failed") {
      const razorpayOrderId = paymentEntity.order_id;
      
      const order = await Order.findOne({
        razorpayOrderId: razorpayOrderId,
        paymentMethod: "ONLINE",
      });

      if (order) {
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            paymentStatus: "FAILED",
            // Don't change orderStatus - keep it as is
          },
        });
        console.log("❌ Payment failed for order:", order._id);
      }

      return NextResponse.json({ received: true });
    }

    // For other events, just acknowledge
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Shipment creation helper removed - now handled by admin panel
