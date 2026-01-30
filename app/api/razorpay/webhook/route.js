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
import { sendOrderToDelhivery, isOrderSentToDelhivery, logVerificationInstructions } from "@/app/lib/delhivery";

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
        
        // If not sent to Delhivery yet, send it now
        if (!isOrderSentToDelhivery(order) && order.orderStatus === "CONFIRMED") {
          console.log("📦 Order confirmed but not sent to Delhivery, sending now...");
          await sendOrderToDelhiveryAndUpdate(order);
        }
        
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

      // Send order to Delhivery if not already sent
      const updatedOrder = await Order.findById(order._id);
      if (!isOrderSentToDelhivery(updatedOrder)) {
        await sendOrderToDelhiveryAndUpdate(updatedOrder);
      }

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

/**
 * Helper function to send order to Delhivery and update order document
 */
async function sendOrderToDelhiveryAndUpdate(order) {
  try {
    const shippingAddress = order.shippingAddress;
    const fullName = shippingAddress?.fullName || "";
    const [firstName, ...rest] = fullName.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    const delhiveryResponse = await sendOrderToDelhivery({
      orderId: order._id.toString(),
      shippingAddress: {
        fullName: fullName,
        firstName: firstName || "",
        lastName: lastName || "",
        phone: shippingAddress?.phone || "",
        addressLine1: shippingAddress?.addressLine1 || "",
        addressLine2: shippingAddress?.addressLine2 || "",
        city: shippingAddress?.city || "",
        state: shippingAddress?.state || "",
        pincode: shippingAddress?.pincode || "",
        country: shippingAddress?.country || "India",
      },
      paymentMethod: order.paymentMethod,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
      })),
      totalAmount: order.totalAmount,
    });

    const updateData = {};

    if (delhiveryResponse?.success) {
      updateData.delhiveryWaybill = delhiveryResponse.waybill;
      updateData.delhiveryCourierName = delhiveryResponse.courier_name;
      updateData.delhiveryDeliveryStatus = delhiveryResponse.delivery_status;
      updateData.delhiveryTrackingUrl = delhiveryResponse.tracking_url;
      updateData.delhiverySent = true;
      updateData.delhiveryError = null;
      
      // Standardized delivery fields
      updateData.delivery_provider = "DELHIVERY";
      updateData.delivery_status = delhiveryResponse.delivery_status || "CREATED";
      
      // Legacy fields
      updateData.delhiveryAWB = delhiveryResponse.waybill;
      updateData.delhiveryTrackingId = delhiveryResponse.waybill;
      updateData.delhiveryPartner = delhiveryResponse.courier_name;
      
      // Log verification instructions if real waybill (not mock)
      if (!delhiveryResponse.isMock && delhiveryResponse.waybill) {
        logVerificationInstructions(delhiveryResponse.waybill);
      }
      
      console.log("✅ Order sent to Delhivery via webhook:", {
        orderId: order._id,
        waybill: delhiveryResponse.waybill,
        isMock: delhiveryResponse.isMock || false,
      });
    } else {
      updateData.delhiverySent = false;
      updateData.delhiveryError = delhiveryResponse?.error || "Unknown error";
      updateData.delhiveryDeliveryStatus = "NOT_SENT";
      updateData.delivery_provider = "DELHIVERY"; // Still mark provider even on failure
      updateData.delivery_status = "NOT_SENT";
      
      console.error("❌ Failed to send order to Delhivery via webhook:", {
        orderId: order._id,
        error: updateData.delhiveryError,
      });
    }

    await Order.findByIdAndUpdate(order._id, { $set: updateData });
  } catch (error) {
    console.error("❌ Error sending order to Delhivery via webhook:", error);
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        delhiverySent: false,
        delhiveryError: error.message || "Unknown error",
        delhiveryDeliveryStatus: "NOT_SENT",
        delivery_provider: "DELHIVERY",
        delivery_status: "NOT_SENT",
      },
    });
  }
}
