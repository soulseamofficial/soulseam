/**
 * Razorpay Webhook Handler
 * 
 * Production-grade webhook handler for Razorpay payment events.
 * 
 * IMPORTANT: This route requires raw body for signature verification.
 * Next.js automatically handles this when using req.text().
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

export async function POST(req) {
  try {
    await connectDB();

    //------------------------------------------------
    // GET RAW BODY FOR SIGNATURE VERIFICATION
    //------------------------------------------------
    // In Next.js App Router, req.text() gives us the raw body as a string
    // This is required for Razorpay signature verification
    const rawBody = await req.text();

    //------------------------------------------------
    // SIGNATURE VERIFICATION
    //------------------------------------------------
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers.get("x-razorpay-signature");

    if (!webhookSecret) {
      console.error("❌ RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    if (!receivedSignature) {
      console.error("❌ Missing Razorpay webhook signature");
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

    // Verify signature
    if (expectedSignature !== receivedSignature) {
      console.error("❌ Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Parse the webhook event
    const event = JSON.parse(rawBody);

    //------------------------------------------------
    // HANDLE payment.captured
    //------------------------------------------------
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      const razorpayOrderId = payment.order_id;
      const paymentId = payment.id;
      const amount = payment.amount / 100; // Convert from paise to rupees

      //------------------------------------------------
      // FIND ORDER
      //------------------------------------------------
      const order = await Order.findOne({
        razorpayOrderId: razorpayOrderId,
      });

      //------------------------------------------------
      // SAFETY NET — ORDER NOT FOUND
      //------------------------------------------------
      if (!order) {
        // Save as orphan payment to prevent revenue loss
        await OrphanPayment.create({
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: paymentId,
          amount: amount,
          amountInPaise: payment.amount,
          currency: payment.currency || "INR",
          event: "payment.captured",
          paymentStatus: "captured",
          rawPayload: payment,
          notes: "Order not found when webhook arrived. Payment captured but order was never created in DB.",
        });

        console.error("❌ Payment received but order missing:", {
          razorpayOrderId: razorpayOrderId,
          paymentId: paymentId,
          amount: amount,
        });

        return NextResponse.json({
          status: "stored_as_orphan",
          received: true,
        });
      }

      //------------------------------------------------
      // IDEMPOTENCY CHECK (PREVENT DOUBLE UPDATE)
      //------------------------------------------------
      if (order.paymentStatus === "PAID") {
        console.log("✅ Order already paid (idempotency check):", {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        });
        return NextResponse.json({
          status: "already_processed",
          received: true,
          orderId: order._id.toString(),
        });
      }

      //------------------------------------------------
      // UPDATE ORDER
      //------------------------------------------------
      await Order.findByIdAndUpdate(
        order._id,
        {
          $set: {
            orderStatus: "CONFIRMED", // Order is confirmed when payment is captured
            paymentStatus: "PAID",
            razorpayPaymentId: paymentId,
            paidAt: new Date(),
            // Legacy fields for backward compatibility
            "payment.status": "paid",
            "payment.razorpayPaymentId": paymentId,
            legacyOrderStatus: "paid",
          },
        }
      );

      console.log("✅ Order marked as PAID:", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentId: paymentId,
      });
    }

    //------------------------------------------------
    // HANDLE FAILED PAYMENTS
    //------------------------------------------------
    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      const order = await Order.findOne({
        razorpayOrderId: razorpayOrderId,
      });

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

        console.log("❌ Payment failed:", {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          razorpayOrderId: razorpayOrderId,
        });
      } else {
        console.error("❌ Payment failed but order not found:", {
          razorpayOrderId: razorpayOrderId,
        });
      }
    }

    //------------------------------------------------
    // ACKNOWLEDGE WEBHOOK
    //------------------------------------------------
    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json(
      { error: "Webhook Server Error" },
      { status: 500 }
    );
  }
}
