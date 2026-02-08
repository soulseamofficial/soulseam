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

      if (paymentStatus !== "captured") {
        console.log("⚠️ Payment not captured, status:", paymentStatus);
        return NextResponse.json({ received: true });
      }

      // Find order by Razorpay order ID
      const order = await Order.findOne({
        razorpayOrderId: razorpayOrderId,
        paymentMethod: "ONLINE",
      });

      if (!order) {
        console.warn("⚠️ Order not found for Razorpay order ID:", razorpayOrderId);
        return NextResponse.json({ received: true, message: "Order not found" });
      }

      // Check if order is already processed
      if (order.paymentStatus === "PAID" && order.orderStatus === "CONFIRMED") {
        console.log("✅ Order already confirmed:", order._id);
        return NextResponse.json({ received: true, message: "Order already processed" });
      }

      // Update order: payment PAID, order CONFIRMED
      await Order.findByIdAndUpdate(order._id, {
        $set: {
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
          razorpayPaymentId: razorpayPaymentId,
          razorpaySignature: paymentEntity.signature || null,
          // Legacy fields
          "payment.status": "paid",
          legacyOrderStatus: "paid",
        },
      });

      console.log("✅ Order updated to CONFIRMED:", order._id);

      // Update user orderCount and firstOrderCouponUsed when order is confirmed (logged-in users only)
      if (order.userId) {
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

      return NextResponse.json({ received: true, orderId: order._id.toString() });
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
