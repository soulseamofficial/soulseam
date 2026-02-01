import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Settings from "@/app/models/Settings";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { amount, orderType = "cod_advance" } = body; // orderType: "cod_advance" or "online"

    // Validate amount
    let finalAmount = amount;
    
    if (orderType === "cod_advance") {
      // For COD advance, get amount from settings
      const settings = await Settings.getSettings();
      if (!settings.codAdvanceEnabled) {
        return NextResponse.json(
          { error: "COD advance payment is not enabled" },
          { status: 400 }
        );
      }
      finalAmount = settings.codAdvanceAmount;
    }

    if (!finalAmount || typeof finalAmount !== "number" || finalAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Check Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay configuration missing" },
        { status: 500 }
      );
    }

    // Create Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100), // Convert to paise
      currency: "INR",
      receipt: `rcpt_${orderType}_${Date.now()}`
    });

    if (!order || !order.id) {
      return NextResponse.json(
        { error: "Failed to create payment order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount, // Amount in paise
      amountInRupees: finalAmount,
    });
  } catch (err) {
    console.error("Razorpay create order error:", err);
    return NextResponse.json(
      { error: err.message || "Order creation failed" },
      { status: 500 }
    );
  }
}
