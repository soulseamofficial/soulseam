import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import Order from "@/app/models/Order";
import Razorpay from "razorpay";

export async function GET(req, { params }) {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { orderId } = await params;

    // Find the order and verify ownership
    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { userId: user._id },
        { guestUserId: user._id }
      ]
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Only allow payment for COD orders with PENDING status
    if (order.paymentMethod !== "COD" || order.paymentStatus !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "This order is not eligible for payment" },
        { status: 400 }
      );
    }

    // Check Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { success: false, error: "Payment gateway configuration missing" },
        { status: 500 }
      );
    }

    // Create Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Create Razorpay order
    const amount = Math.round((order.totalAmount || 0) * 100); // Convert to paise
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid order amount" },
        { status: 400 }
      );
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: `ord_${order._id.toString().slice(-8)}`,
    });

    if (!razorpayOrder || !razorpayOrder.id) {
      return NextResponse.json(
        { success: false, error: "Failed to create payment order" },
        { status: 500 }
      );
    }

    // Update order with Razorpay order ID (but keep payment status as PENDING until verified)
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        razorpayOrderId: razorpayOrder.id,
      }
    });

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // Amount in paise
    });
  } catch (error) {
    console.error("[Orders Pay] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
