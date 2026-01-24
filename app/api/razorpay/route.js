import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export async function POST(req) {
  try {
    const { amount } = await req.json();

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR"
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount
    });
  } catch (err) {
    console.error("Razorpay error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
