import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { verifyRazorpaySignature, markOrderAsPaid } from "@/app/lib/razorpay";
import Order from "@/app/models/Order";
import Razorpay from "razorpay";

/**
 * Structured logger for verify endpoint
 */
function logVerify(level, message, context = {}) {
  const { orderId, razorpayOrderId, paymentId, ...rest } = context;
  const logData = {
    timestamp: new Date().toISOString(),
    service: "verify",
    message,
    context: {
      orderId: orderId ? String(orderId) : undefined,
      razorpayOrderId,
      paymentId,
      ...rest,
    },
  };

  if (level === "error") {
    console.error(`[VERIFY] ${message}`, logData);
  } else if (level === "warn") {
    console.warn(`[VERIFY] ${message}`, logData);
  } else {
    console.log(`[VERIFY] ${message}`, logData);
  }
}

/**
 * POST /api/payment/verify
 * 
 * PRIMARY payment verification endpoint (called immediately after payment success on frontend).
 * The webhook acts as a backup only.
 * 
 * Flow:
 * 1. Validates required fields
 * 2. Verifies Razorpay payment signature
 * 3. Connects to database
 * 4. Marks order as PAID using atomic update (idempotent)
 * 5. Returns order status
 * 
 * Request body:
 * {
 *   razorpay_order_id: string,
 *   razorpay_payment_id: string,
 *   razorpay_signature: string
 * }
 */
export async function POST(req) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      logVerify("error", "Missing required fields", {
        razorpayOrderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        hasSignature: !!razorpay_signature,
      });
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_FIELDS",
          message: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required",
        },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const isValid = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      logVerify("error", "Payment signature verification failed", {
        razorpayOrderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_SIGNATURE",
          message: "Payment signature verification failed",
        },
        { status: 400 }
      );
    }

    logVerify("info", "Payment signature verified", {
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    // Connect to database (service functions assume DB is already connected)
    await connectDB();

    // CRITICAL FRAUD PROTECTION: Fetch payment details from Razorpay to validate amount
    let paymentAmount = null;
    let paymentAmountInPaise = null;
    
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        
        // Fetch payment details from Razorpay
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
        if (payment && payment.amount) {
          paymentAmountInPaise = payment.amount;
          paymentAmount = payment.amount / 100; // Convert to rupees
          
          logVerify("info", "Payment amount fetched from Razorpay", {
            razorpayOrderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            paymentAmountInPaise,
            paymentAmount,
          });
        } else {
          logVerify("warn", "Payment amount not found in Razorpay response", {
            razorpayOrderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
          });
        }
      } catch (error) {
        // Log error but continue - amount validation will be skipped if fetch fails
        logVerify("warn", "Failed to fetch payment details from Razorpay", {
          razorpayOrderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          error: error.message,
        });
      }
    }

    // Mark order as paid with idempotency protection and amount validation
    // This uses atomic findOneAndUpdate to prevent race conditions
    const result = await markOrderAsPaid(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      { 
        isWebhook: false,
        paymentAmount,
        paymentAmountInPaise,
      }
    );

    if (!result.success) {
      if (result.error === "ORDER_NOT_FOUND") {
        logVerify("error", "Order not found", {
          razorpayOrderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
        });
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            message: "Order not found",
          },
          { status: 404 }
        );
      }

      if (result.error === "PAYMENT_ID_MISMATCH") {
        logVerify("warn", "Payment ID mismatch", {
          razorpayOrderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          existingPaymentId: result.order?.razorpayPaymentId,
        });
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            message: "Order already paid with a different payment ID",
          },
          { status: 409 }
        );
      }

      if (result.error === "AMOUNT_MISMATCH") {
        logVerify("error", "CRITICAL FRAUD ALERT: Payment amount mismatch", {
          razorpayOrderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          orderAmount: result.order?.totalAmount,
          paymentAmount,
          paymentAmountInPaise,
        });
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            message: "Payment amount does not match order amount. Fraud attempt detected.",
          },
          { status: 400 }
        );
      }

      logVerify("error", "Failed to update order payment status", {
        razorpayOrderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        error: result.error,
      });
      return NextResponse.json(
        {
          success: false,
          error: result.error || "PAYMENT_UPDATE_FAILED",
          message: "Failed to update order payment status",
        },
        { status: 500 }
      );
    }

    const responseTime = Date.now() - startTime;
    logVerify("info", "Payment verified successfully", {
      orderId: result.order._id.toString(),
      orderNumber: result.order.orderNumber,
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      alreadyProcessed: result.alreadyProcessed,
      responseTime: `${responseTime}ms`,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      alreadyProcessed: result.alreadyProcessed,
      message: result.alreadyProcessed
        ? "Payment already verified"
        : "Payment verified and order confirmed",
      order: {
        orderId: result.order._id.toString(),
        orderNumber: result.order.orderNumber,
        paymentStatus: result.order.paymentStatus,
        orderStatus: result.order.orderStatus,
        razorpayPaymentId: result.order.razorpayPaymentId,
        paidAt: result.order.paidAt,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logVerify("error", "Payment verification error", {
      error: error.message,
      stack: error.stack,
      responseTime: `${responseTime}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error.message || "An error occurred while verifying payment",
      },
      { status: 500 }
    );
  }
}
