import { NextResponse } from "next/server";
import Order from "../../../models/Order";
import { connectDB } from "../../../lib/db";

export async function POST(req) {
  try {
    await connectDB();

    const {
      orderId,
      paymentMethod,
      paymentStatus,
      razorpayPaymentId,

      deliveryPartner,
      trackingId,
      awb,
      pickupScheduled,
    } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID missing" },
        { status: 400 }
      );
    }

    const update = {
      orderStatus: "confirmed",
      deliveryStatus: "created",
      deliveryPartner,
      trackingId,
      awb,
      pickupScheduled,
      payment: {
        method: paymentMethod,
        status: paymentStatus,
        razorpayPaymentId: razorpayPaymentId || null,
      },
    };

    await Order.findByIdAndUpdate(orderId, update);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}