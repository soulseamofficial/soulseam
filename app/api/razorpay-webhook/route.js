import crypto from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";

export async function POST(req) {
  try {

    await connectDB();

    // ✅ Get RAW body
    const rawBody = await req.arrayBuffer();
    const bodyBuffer = Buffer.from(rawBody);

    const signature = req.headers.get("x-razorpay-signature");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(bodyBuffer)
      .digest("hex");

    //------------------------------------------------
    // SIGNATURE CHECK
    //------------------------------------------------

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(bodyBuffer.toString());

    //------------------------------------------------
    // HANDLE PAYMENT CAPTURE
    //------------------------------------------------

    if (event.event === "payment.captured") {

      const payment = event.payload.payment.entity;

      const razorpayOrderId = payment.order_id;

      const order = await Order.findOne({
        razorpayOrderId: razorpayOrderId
      });

      // SAFETY — if order missing
      if (!order) {
        console.error("Order not found for payment:", razorpayOrderId);
        return NextResponse.json({ ignored: true });
      }

      // IDEMPOTENCY
      if (order.paymentStatus === "PAID") {
        return NextResponse.json({ alreadyProcessed: true });
      }

      //------------------------------------------------
      // UPDATE ORDER
      //------------------------------------------------

      await Order.updateOne(
        { razorpayOrderId: razorpayOrderId },
        {
          $set: {
            paymentStatus: "PAID",
            orderStatus: "CONFIRMED",
            razorpayPaymentId: payment.id,
            paidAt: new Date()
          }
        }
      );

      console.log("✅ Order marked PAID:", razorpayOrderId);
    }

    return NextResponse.json({ received: true });

  } catch (err) {

    console.error("Webhook crash:", err);

    return new NextResponse("Webhook Error", { status: 500 });
  }
}
