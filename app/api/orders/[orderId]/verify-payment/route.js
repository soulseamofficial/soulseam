import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import Order from "@/app/models/Order";
import crypto from "crypto";

function verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === razorpay_signature;
}

export async function POST(req, { params }) {
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
    const body = await req.json();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing payment verification details" },
        { status: 400 }
      );
    }

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

    // Verify Razorpay signature
    const isValid = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Verify that the Razorpay order ID matches
    if (order.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json(
        { success: false, error: "Order ID mismatch" },
        { status: 400 }
      );
    }

    // Update order: payment PAID, order CONFIRMED
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        paymentStatus: "PAID",
        paymentMethod: "RAZORPAY",
        orderStatus: "CONFIRMED",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        // Legacy fields for backward compatibility
        "payment.status": "paid",
        legacyOrderStatus: "paid",
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Orders Verify Payment] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
