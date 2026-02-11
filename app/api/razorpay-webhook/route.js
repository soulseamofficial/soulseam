import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import OrphanPayment from "@/app/models/OrphanPayment";

export async function POST(req) {
  try {
    await connectDB();

    // ✅ Get RAW body (CRITICAL for Razorpay signature)
    const rawBody = await req.text();

    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    //------------------------------------------------
    // SIGNATURE VERIFICATION
    //------------------------------------------------

    if (!secret) {
      console.error("Webhook secret missing");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    //------------------------------------------------
    // Parse event
    //------------------------------------------------

    const body = JSON.parse(rawBody);
    const event = body.event;
    const payment = body.payload?.payment?.entity;

    if (!event || !payment) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    console.log("✅ Razorpay webhook:", event);

    //------------------------------------------------
    // HANDLE SUCCESSFUL PAYMENT
    //------------------------------------------------

    if (event === "payment.captured") {

      const razorpayOrderId = payment.order_id;
      const paymentId = payment.id;
      const amount = payment.amount / 100;

      //--------------------------------------------
      // FIND ORDER
      //--------------------------------------------

      const order = await Order.findOne({
        razorpayOrderId: razorpayOrderId
      });

      //--------------------------------------------
      // SAFETY NET — ORPHAN PAYMENT
      //--------------------------------------------

      if (!order) {

        await OrphanPayment.create({
          razorpayOrderId,
          razorpayPaymentId: paymentId,
          amount,
          amountInPaise: payment.amount,
          currency: payment.currency || "INR",
          event: event,
          paymentStatus: "captured",
          rawPayload: payment,
        });

        console.error("⚠️ Payment received but order missing");

        return NextResponse.json({ received: true });
      }

      //--------------------------------------------
      // IDEMPOTENCY CHECK (VERY IMPORTANT)
      //--------------------------------------------

      if (order.paymentStatus === "PAID") {
        console.log("Duplicate webhook ignored");
        return NextResponse.json({ received: true });
      }

      //--------------------------------------------
      // UPDATE ORDER
      //--------------------------------------------

      await Order.findByIdAndUpdate(order._id, {
        $set: {
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
          razorpayPaymentId: paymentId,
          paidAt: new Date()
        }
      });

      console.log("🎉 Order marked PAID:", order.orderNumber);
    }

    //------------------------------------------------
    // HANDLE FAILED PAYMENT
    //------------------------------------------------

    if (event === "payment.failed") {

      await Order.updateOne(
        { razorpayOrderId: payment.order_id },
        {
          $set: {
            paymentStatus: "FAILED"
          }
        }
      );

      console.log("❌ Payment failed:", payment.order_id);
    }

    return NextResponse.json({ received: true });

  } catch (err) {

    console.error("Webhook crash:", err);

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
