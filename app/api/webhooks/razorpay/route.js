import crypto from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { markOrderAsPaid, markOrderAdvancePaid } from "@/app/lib/razorpay";
import Order from "@/app/models/Order";

export async function POST(req) {
  try {

    // ✅ GET RAW BODY
    const rawBody = await req.text();

    const signature = req.headers.get("x-razorpay-signature");

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("Missing webhook secret");
      return new NextResponse("Webhook secret missing", { status: 500 });
    }

    // ✅ VERIFY SIGNATURE
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid webhook signature");
      return new NextResponse("Invalid signature", { status: 400 });
    }

    // ✅ NOW parse JSON safely
    const event = JSON.parse(rawBody);

    // Log only event type, never full payload
    console.log("Webhook received:", event.event);

    //---------------------------------------
    // HANDLE PAYMENT CAPTURED
    //---------------------------------------

    if (event.event === "payment.captured") {
      // ✅ STEP 2: EXTRACT PAYMENT DATA FROM PAYLOAD
      const payment = event.payload.payment.entity;

      const razorpay_order_id = payment.order_id;
      const razorpay_payment_id = payment.id;
      
      // Extract payment amount for validation (if available)
      const paymentAmountInPaise = payment.amount || null;
      const paymentAmount = paymentAmountInPaise ? paymentAmountInPaise / 100 : null;

      // ✅ STEP 2: EXTRACT SIGNATURE FROM HEADER
      // Note: This is the webhook verification signature, not the payment signature
      // Payment signatures are only available from frontend verify calls
      const signatureFromHeader = signature; // Already extracted from x-razorpay-signature header

      // Connect to database
      await connectDB();

      // ✅ STEP 2: Determine if this is a COD advance payment or ONLINE payment
      // Find order first to check payment method
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id }).lean();
      
      if (!order) {
        console.error("Webhook: Order not found", {
          orderNumber: null,
          razorpayPaymentId: razorpay_payment_id,
        });
        return new NextResponse("Order not found (logged)", { status: 200 });
      }

      // ✅ STEP 3: CALL APPROPRIATE HELPER BASED ON PAYMENT METHOD
      // Webhook is the SINGLE SOURCE OF TRUTH for payment persistence
      let result;
      
      if (order.paymentMethod === "COD") {
        // COD Advance Payment - update to PARTIALLY_PAID
        result = await markOrderAdvancePaid(
          razorpay_order_id,
          razorpay_payment_id,
          signatureFromHeader, // Pass webhook signature for audit trail
          {
            isWebhook: true,
            paymentAmount,
            paymentAmountInPaise,
          }
        );
      } else {
        // ONLINE Payment - update to PAID
        result = await markOrderAsPaid(
          razorpay_order_id,
          razorpay_payment_id,
          signatureFromHeader, // Pass webhook signature for audit trail
          {
            isWebhook: true,
            paymentAmount,
            paymentAmountInPaise,
          }
        );
      }

      // Handle result
      if (!result.success) {
        if (result.error === "ORDER_NOT_FOUND") {
          // CRITICAL: Never create new order during payment update
          // Log error and return success to prevent webhook retries
          console.error("Webhook: Order not found", {
            orderNumber: null,
            razorpayPaymentId: razorpay_payment_id,
          });
          // Return 200 to prevent Razorpay from retrying
          return new NextResponse("Order not found (logged)", { status: 200 });
        }

        // For other errors, log and return success (webhook retries must NOT crash)
        console.error("Webhook: Payment update failed", {
          orderNumber: result.order?.orderNumber || null,
          razorpayPaymentId: razorpay_payment_id,
          error: result.error,
        });
        // Return 200 to prevent webhook retries
        return new NextResponse("Payment update failed (logged)", { status: 200 });
      }

      // Success - log only orderNumber and paymentId
      if (result.alreadyProcessed) {
        console.log("Webhook: Payment already processed (idempotent)", {
          orderNumber: result.order?.orderNumber || null,
          razorpayPaymentId: razorpay_payment_id,
        });
      } else {
        console.log("Webhook: Payment processed successfully", {
          orderNumber: result.order?.orderNumber || null,
          razorpayPaymentId: razorpay_payment_id,
        });
        // NOTE: Shipment creation is now manual-only via Admin Dashboard
        // Webhook ONLY marks payment as PAID - nothing else
      }
    }

    return new NextResponse("Webhook processed", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    // Return 200 to prevent webhook retries from crashing
    return new NextResponse("Webhook failed (logged)", { status: 200 });
  }
}
