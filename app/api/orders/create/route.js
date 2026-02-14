import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import { getNextOrderNumber } from "@/app/lib/getNextOrderNumber";

/**
 * Normalize items array - reuse from checkout route
 */
function normalizeItems(items) {
  if (!Array.isArray(items)) {
    console.error("normalizeItems: items is not an array", items);
    return [];
  }
  
  if (items.length === 0) {
    console.error("normalizeItems: items array is empty");
    return [];
  }

  const normalized = items
    .map((it, index) => {
      const rawProductId = it.productId || it._id || it.id;
      
      if (!rawProductId) {
        console.error("normalizeItems: Item missing productId/_id/id", {
          index,
          item: it,
        });
        return null;
      }

      const productId = String(rawProductId);
      
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        console.error("normalizeItems: Invalid ObjectId format", {
          index,
          productId,
          originalItem: it,
        });
        return null;
      }

      const name = String(it.name || "");
      const price = Number(it.finalPrice ?? it.price ?? 0);
      
      const normalizedItem = {
        productId,
        name,
        image: String(it.image || ""),
        size: String(it.size || ""),
        color: String(it.color || ""),
        price,
        quantity: Math.max(1, Number(it.quantity || 1)),
      };
      
      return normalizedItem;
    })
    .filter((it) => {
      if (!it) return false;
      const hasValidId = it.productId && mongoose.Types.ObjectId.isValid(it.productId);
      const hasValidName = it.name && it.name.trim() !== "";
      const hasValidPrice = it.price > 0;
      return hasValidId && hasValidName && hasValidPrice;
    });

  return normalized;
}

/**
 * Normalize address - reuse from checkout route
 */
function normalizeAddress(a) {
  const fullName = typeof a?.fullName === "string" ? a.fullName.trim() : "";
  const phone = typeof a?.phone === "string" ? a.phone.trim() : "";
  const addressLine1 = typeof a?.addressLine1 === "string" ? a.addressLine1.trim() : "";
  const addressLine2 = typeof a?.addressLine2 === "string" ? a.addressLine2.trim() : "";
  const city = typeof a?.city === "string" ? a.city.trim() : "";
  const state = typeof a?.state === "string" ? a.state.trim() : "";
  const pincode = typeof a?.pincode === "string" ? a.pincode.trim() : "";
  const country = typeof a?.country === "string" ? a.country.trim() : "India";

  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    return null;
  }

  return { fullName, phone, addressLine1, addressLine2, city, state, pincode, country };
}


/**
 * POST /api/orders/create
 * 
 * BULLETPROOF ORDER CREATION SYSTEM
 * 
 * Creates order in MongoDB BEFORE payment and returns Razorpay order details
 * 
 * Features:
 * ✅ Atomic order number generation (race-condition safe)
 * ✅ Idempotent (prevents duplicate orders from payment retries)
 * ✅ Retry-safe insert (handles duplicate key errors gracefully)
 * ✅ Serverless safe (works across multiple concurrent instances)
 * ✅ Payment retry safe (uses paymentAttemptId for idempotency)
 * ✅ Webhook safe (handles webhook retries)
 * ✅ Production scalable (atomic MongoDB operations)
 * 
 * Flow:
 * 1. Check for existing order by paymentAttemptId (idempotency)
 * 2. Generate unique order number using atomic counter
 * 3. Create order in MongoDB with retry logic
 * 4. Create Razorpay order
 * 5. Update order with razorpay_order_id and paymentAttemptId
 * 6. Return razorpay_order_id, order_number, amount, key
 * 
 * NOTE: For replica sets, consider wrapping counter increment + order insert
 * in a MongoDB transaction for bank-level consistency (optional but recommended).
 * Current implementation uses atomic operations which are sufficient for most use cases.
 */
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Log only orderNumber and paymentAttemptId (never full payment payload)
    const logPaymentAttemptId = body?.razorpay_order_id || body?.razorpay_payment_id || null;
    console.log("📦 CREATE ORDER API: Request received", {
      paymentAttemptId: logPaymentAttemptId,
      itemsCount: body?.items?.length || 0,
    });

    // Get authenticated user
    const authed = await getAuthUserFromCookies();
    const userId = authed?._id || null;
    let guestUserId = null;

    // Handle guestUserId
    if (!userId && body?.guestUserId) {
      const guestIdValue = body.guestUserId;
      if (typeof guestIdValue === "string" && guestIdValue.trim()) {
        const guestIdStr = guestIdValue.trim();
        if (mongoose.Types.ObjectId.isValid(guestIdStr)) {
          guestUserId = new mongoose.Types.ObjectId(guestIdStr);
        } else {
          return NextResponse.json(
            { success: false, message: "Invalid guestUserId format" },
            { status: 400 }
          );
        }
      } else if (guestIdValue instanceof mongoose.Types.ObjectId) {
        guestUserId = guestIdValue;
      }
    }

    // Validate user or guest
    if (!userId && !guestUserId) {
      return NextResponse.json(
        { success: false, message: "userId or guestUserId required" },
        { status: 400 }
      );
    }

    // Validate payment method (must be ONLINE for this endpoint)
    const paymentMethod = body?.paymentMethod === "ONLINE" ? "ONLINE" : "";
    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, message: "paymentMethod must be ONLINE" },
        { status: 400 }
      );
    }

    // Validate shipping address
    const shippingAddress = normalizeAddress(body?.shippingAddress);
    if (!shippingAddress) {
      return NextResponse.json(
        { success: false, message: "Valid shippingAddress required" },
        { status: 400 }
      );
    }

    // Validate items
    const items = normalizeItems(body?.items);
    if (items.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one valid item is required" },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = Number(body?.subtotal ?? 0);
    const discount = Number(body?.discount ?? 0);
    const totalAmount = Number(body?.total ?? body?.totalAmount ?? (subtotal - discount));

    // Validate totals
    if (subtotal < 0 || discount < 0 || totalAmount < 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount values" },
        { status: 400 }
      );
    }

    if (totalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Total amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Handle coupon
    const coupon =
      body?.coupon && typeof body.coupon === "object"
        ? {
            code: typeof body.coupon.code === "string" ? body.coupon.code.trim() : "",
            discount: Number(body.coupon.discount ?? discount ?? 0),
          }
        : null;

    // Extract order message (optional)
    const orderMessage = body?.orderMessage && typeof body.orderMessage === "string"
      ? body.orderMessage.trim().substring(0, 250)
      : null;

    // Prepare customer info for legacy fields
    const fullName = shippingAddress.fullName || "";
    const [firstName, ...rest] = fullName.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    // STEP 1: IDEMPOTENCY CHECK - Prevent duplicate orders from payment retries
    // Extract paymentAttemptId from request (razorpay_order_id or razorpay_payment_id)
    const paymentAttemptId = body?.razorpay_order_id || body?.razorpay_payment_id || null;
    
    if (paymentAttemptId) {
      const existingOrder = await Order.findOne({
        paymentAttemptId: paymentAttemptId
      });
      
      if (existingOrder) {
        // Order already exists - return existing order (idempotent response)
        console.log("✅ Existing order found (idempotency):", {
          orderNumber: existingOrder.orderNumber,
          paymentAttemptId: existingOrder.paymentAttemptId
        });
        
        // If Razorpay order doesn't exist yet, we still need to create it
        // But return the existing order info
        if (!existingOrder.razorpayOrderId) {
          // Continue to create Razorpay order and update
        } else {
          // Order and Razorpay order both exist - return immediately
          return NextResponse.json({
            success: true,
            razorpay_order_id: existingOrder.razorpayOrderId,
            order_number: existingOrder.orderNumber,
            order_id: existingOrder._id.toString(),
            amount: Math.round(existingOrder.totalAmount * 100), // Amount in paise
            amountInRupees: existingOrder.totalAmount,
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          });
        }
      }
    }

    // STEP 2: Create MongoDB order with retry-safe insert (BULLETPROOF)
    // This ensures we have a database record before any payment can be processed
    // Uses industry-standard retry pattern: generate order number INSIDE loop
    let order = null;
    let retries = 1; // Allow 1 retry (2 total attempts)
    let orderNumber = null;
    
    while (retries >= 0) {
      try {
        // Generate order number INSIDE loop (never reuse - gaps are acceptable)
        // This ensures each attempt gets a fresh, unique order number
        orderNumber = await getNextOrderNumber();
        
        console.log("🔄 Order creation attempt:", {
          orderNumber,
          paymentAttemptId,
          retriesRemaining: retries
        });
        
        order = await Order.create({
          userId: userId || null,
          guestUserId: guestUserId || null,
          orderNumber,
          paymentAttemptId: paymentAttemptId || null, // Set for idempotency
          items,
          shippingAddress,
          paymentMethod: "ONLINE",
          paymentStatus: "PENDING",
          orderStatus: "CREATED", // Will be updated to "CONFIRMED" when payment is captured
          coupon: coupon?.code ? coupon : null,
          subtotal,
          discount,
          discountAmount: discount,
          shipping: 0,
          totalAmount,
          finalTotal: totalAmount,
          advancePaid: 0,
          remainingCOD: 0,
          razorpayOrderId: null, // Will be set after Razorpay order creation
          orderMessage: orderMessage || null,
          orderSource: "WEBSITE",

      // Legacy fields for backward compatibility
      customer: {
        email: authed?.email || "",
        firstName: firstName || "",
        lastName: lastName || "",
        phone: shippingAddress.phone || "",
      },
      shippingAddressLegacy: {
        address: shippingAddress.addressLine1 || "",
        apt: shippingAddress.addressLine2 || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        pin: shippingAddress.pincode || "",
        country: shippingAddress.country || "",
      },
      payment: {
        method: "Razorpay",
        status: "pending",
      },
      legacyOrderStatus: "created",
        });
        
        // Order created successfully - break out of retry loop
        console.log("✅ Order created successfully:", {
          orderNumber: order.orderNumber,
          paymentAttemptId: order.paymentAttemptId
        });
        break;
      } catch (error) {
        // Handle duplicate key errors (orderNumber or paymentAttemptId conflict)
        if (error.code === 11000) {
          const duplicateField = error.keyPattern?.orderNumber ? 'orderNumber' : 
                                 error.keyPattern?.paymentAttemptId ? 'paymentAttemptId' : 'unknown';
          
          console.log("⚠️ Duplicate key error detected:", {
            field: duplicateField,
            orderNumber,
            paymentAttemptId,
            retriesRemaining: retries
          });
          
          // If duplicate paymentAttemptId, check if order exists (idempotency)
          if (duplicateField === 'paymentAttemptId' && paymentAttemptId) {
            const existingOrder = await Order.findOne({
              paymentAttemptId: paymentAttemptId
            });
            
            if (existingOrder) {
              // Order exists - return it (idempotent response)
              console.log("✅ Existing order found after duplicate error (idempotency):", {
                orderNumber: existingOrder.orderNumber,
                paymentAttemptId: existingOrder.paymentAttemptId
              });
              
              order = existingOrder;
              break; // Exit retry loop - order already exists
            }
          }
          
          // If duplicate orderNumber or other duplicate error, retry with new order number
          // NOTE: We intentionally DO NOT reuse order numbers - gaps are acceptable
          // This is standard ecommerce practice to prevent duplicates
          if (retries > 0) {
            retries--;
            console.log("🔄 Retrying with new order number (order number will not be reused):", {
              paymentAttemptId,
              retriesRemaining: retries
            });
            continue; // Retry with new order number (generated at start of loop)
          } else {
            // Exhausted retries - throw error
            console.error("❌ Max retries reached for order creation:", {
              orderNumber,
              paymentAttemptId,
              error: error.message
            });
            throw error;
          }
        } else {
          // Non-duplicate error - throw immediately (don't retry validation errors, etc.)
          console.error("❌ Non-duplicate error during order creation:", {
            orderNumber,
            paymentAttemptId,
            error: error.message
          });
          throw error;
        }
      }
    }
    
    if (!order) {
      // This should never happen, but safety check
      throw new Error("Failed to create order after retries");
    }

    console.log("✅ Order created in MongoDB (database-first):", {
      orderNumber: order.orderNumber,
      paymentAttemptId: order.paymentAttemptId
    });

    // STEP 3 & 4: Create Razorpay order AND update MongoDB in STRONG try/catch
    // CRITICAL: If Razorpay order is created but Mongo update fails, we MUST throw error
    // This prevents orphan payments (Razorpay order exists but no DB link)
    let razorpayOrder = null;
    let updatedOrder = null;

    try {
      // STEP 3: Create Razorpay order AFTER successful DB save
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        // If Razorpay config is missing, we still have the order in DB
        // This prevents payments without database records
        console.error("❌ Razorpay configuration missing after order creation");
        return NextResponse.json(
          { success: false, message: "Razorpay configuration missing" },
          { status: 500 }
        );
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      // Create Razorpay order with MongoDB order ID and order number in notes
      // This is set during creation, not edited later
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // Convert to paise
        currency: "INR",
        receipt: `rcpt_${orderNumber}_${Date.now()}`,
        notes: {
          mongoOrderId: order._id.toString(), // MongoDB order ID
          orderNumber: orderNumber, // Order number (SS0001, etc.)
        },
      });

      if (!razorpayOrder || !razorpayOrder.id) {
        // Order exists in DB but Razorpay order creation failed
        // Log critical error - order exists but cannot process payment
        console.error("❌ Failed to create Razorpay order after DB order creation", {
          orderNumber: order.orderNumber,
          paymentAttemptId: order.paymentAttemptId
        });
        return NextResponse.json(
          { success: false, message: "Failed to create Razorpay order" },
          { status: 500 }
        );
      }

      console.log("✅ Razorpay order created:", {
        razorpayOrderId: razorpayOrder.id,
        orderNumber: order.orderNumber,
        paymentAttemptId: order.paymentAttemptId
      });

      // STEP 4: Immediately update MongoDB order with razorpayOrderId and paymentAttemptId
      // CRITICAL: This MUST succeed or we have an orphan payment
      // Also set paymentAttemptId if not already set (use razorpay_order_id)
      const updateData = {
        razorpayOrderId: razorpayOrder.id,
      };
      
      // Set paymentAttemptId if not already set (for idempotency on future retries)
      if (!order.paymentAttemptId) {
        updateData.paymentAttemptId = razorpayOrder.id;
      }
      
      updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        {
          $set: updateData,
        },
        { new: true }
      );

      if (!updatedOrder) {
        // CRITICAL PAYMENT ERROR: Razorpay order created but Mongo update failed
        console.error("🚨 CRITICAL PAYMENT ERROR");
        console.error({
          orderNumber: order.orderNumber,
          paymentAttemptId: order.paymentAttemptId,
          razorpayOrderId: razorpayOrder.id,
          timestamp: new Date().toISOString(),
        });
        // DO NOT continue - throw error to prevent hidden orphan payment
        throw new Error("CRITICAL: Failed to update order with razorpayOrderId. Razorpay order created but DB update failed.");
      }

      // SAFETY CHECK: Verify razorpayOrderId is actually set
      if (!updatedOrder.razorpayOrderId) {
        console.error("🚨 CRITICAL PAYMENT ERROR");
        console.error({
          orderNumber: order.orderNumber,
          paymentAttemptId: order.paymentAttemptId,
          razorpayOrderId: razorpayOrder.id,
          timestamp: new Date().toISOString(),
        });
        throw new Error("CRITICAL: razorpayOrderId is null after update");
      }

      console.log("✅ Order updated with Razorpay order ID:", {
        orderNumber: updatedOrder.orderNumber,
        paymentAttemptId: updatedOrder.paymentAttemptId
      });
    } catch (error) {
      // CRITICAL: If Razorpay order was created but Mongo update failed, log and throw
      if (razorpayOrder && razorpayOrder.id && !updatedOrder) {
        console.error("🚨 CRITICAL PAYMENT ERROR");
        console.error({
          orderNumber: order.orderNumber,
          paymentAttemptId: order.paymentAttemptId,
          razorpayOrderId: razorpayOrder.id,
          timestamp: new Date().toISOString(),
          error: error.message,
        });
        // Throw error - frontend must receive failure
        // We NEVER allow hidden orphan payments
        return NextResponse.json(
          {
            success: false,
            message: "CRITICAL: Payment order created but database update failed. Order cannot be processed.",
            error: "PAYMENT_UPDATE_FAILED",
          },
          { status: 500 }
        );
      }
      // Re-throw other errors
      throw error;
    }

    // STEP 5: Return response
    return NextResponse.json({
      success: true,
      razorpay_order_id: razorpayOrder.id,
      order_number: orderNumber,
      order_id: updatedOrder._id.toString(),
      amount: razorpayOrder.amount, // Amount in paise
      amountInRupees: totalAmount,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("❌ CREATE ORDER ERROR:", {
      error: error.message,
      stack: error.stack,
    });

    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      const duplicateField = error.keyPattern?.orderNumber ? 'orderNumber' : 
                             error.keyPattern?.paymentAttemptId ? 'paymentAttemptId' : 
                             error.keyPattern?.razorpayOrderId ? 'razorpayOrderId' : 'unknown';
      
      console.error("❌ Duplicate key error (unrecoverable):", {
        field: duplicateField,
        error: error.message
      });
      
      // Never show "Order conflict" to customers - return generic error
      return NextResponse.json(
        { success: false, message: "Unable to process order. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
