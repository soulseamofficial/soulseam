import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import Order from "@/app/models/Order";
import { verifyRazorpaySignature, markOrderAsPaid } from "@/app/lib/razorpay";

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

    // ✅ USE SAME FUNCTION AS VERIFY ENDPOINT AND WEBHOOK
    // This ensures idempotency, atomic updates, and prevents duplicate shipments
    const result = await markOrderAsPaid(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      {
        isWebhook: false,
        // Amount validation not available in this endpoint, but signature is verified
      }
    );

    if (!result.success) {
      if (result.error === "ORDER_NOT_FOUND") {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }

      // For other errors, return appropriate status
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "Payment update failed",
          message: result.error === "PAYMENT_ID_MISMATCH" 
            ? "Order already paid with a different payment ID"
            : "Failed to update order payment status"
        },
        { status: result.error === "PAYMENT_ID_MISMATCH" ? 409 : 500 }
      );
    }

    // Log only orderNumber and paymentId
    console.log("Payment verified via verify-payment route", {
      orderNumber: result.order?.orderNumber || null,
      razorpayPaymentId: razorpay_payment_id,
      alreadyProcessed: result.alreadyProcessed,
    });

    return NextResponse.json({ 
      success: true,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error) {
    console.error("[Orders Verify Payment] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
