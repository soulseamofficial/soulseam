import { NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/app/lib/razorpay";

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
 * Payment verification endpoint (called immediately after payment success on frontend).
 * 
 * CRITICAL: This endpoint does NOT write to the database.
 * Webhook is the SINGLE SOURCE OF TRUTH for payment persistence.
 * 
 * Flow:
 * 1. Validates required fields
 * 2. Verifies Razorpay payment signature
 * 3. Returns success to UI
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
        orderNumber: null,
        razorpayPaymentId: razorpay_payment_id || null,
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
        orderNumber: null,
        razorpayPaymentId: razorpay_payment_id,
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
      orderNumber: null,
      razorpayPaymentId: razorpay_payment_id,
    });

    // ✅ STEP 4: VERIFY ROUTE DOES ZERO DB WRITES
    // Webhook is the SINGLE SOURCE OF TRUTH for payment persistence
    // This endpoint only validates signature and returns success to UI

    const responseTime = Date.now() - startTime;
    logVerify("info", "Payment signature verified successfully (no DB write)", {
      razorpayPaymentId: razorpay_payment_id,
      responseTime: `${responseTime}ms`,
    });

    // Return success response - webhook will handle persistence
    return NextResponse.json({
      success: true,
      message: "Payment signature verified successfully. Order will be confirmed by webhook.",
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
