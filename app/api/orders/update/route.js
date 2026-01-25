import { NextResponse } from "next/server";
import Order from "../../../models/Order";
import { connectDB } from "../../../lib/db";

export async function POST(req) {
  try {
    await connectDB();

    const { orderId, paymentStatus, razorpayPaymentId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID missing" },
        { status: 400 }
      );
    }

    await Order.findByIdAndUpdate(orderId, {
      "payment.status": paymentStatus,
      "payment.razorpayPaymentId": razorpayPaymentId || null,
      orderStatus: paymentStatus === "paid" ? "paid" : "pending",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}