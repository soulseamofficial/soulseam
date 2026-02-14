import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import Razorpay from "razorpay";
import mongoose from "mongoose";

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
 * Get next order number using atomic MongoDB counter
 * Guarantees sequential order numbers (SS0001, SS0002, etc.) even under high concurrency
 * Uses atomic findOneAndUpdate to prevent race conditions
 * 
 * @returns {Promise<string>} - Sequential order number (e.g., "SS0001")
 */
async function getNextOrderNumber() {
  const db = mongoose.connection.db;
  
  const counter = await db.collection("counters").findOneAndUpdate(
    { _id: "orderNumber" },
    { $inc: { sequence_value: 1 } },
    { returnDocument: "after", upsert: true }
  );

  return "SS" + String(counter.sequence_value).padStart(4, "0");
}

/**
 * POST /api/orders/create
 * 
 * Creates order in MongoDB BEFORE payment and returns Razorpay order details
 * 
 * Flow:
 * 1. Generate unique order number
 * 2. Create order in MongoDB with status "pending"
 * 3. Create Razorpay order
 * 4. Update order with razorpay_order_id
 * 5. Return razorpay_order_id, order_number, amount, key
 */
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    console.log("📦 CREATE ORDER API: Request received", {
      paymentMethod: body?.paymentMethod,
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

    // STEP 1: Generate unique order number using atomic counter
    const orderNumber = await getNextOrderNumber();
    console.log("✅ Generated order number:", orderNumber);

    // STEP 2: Create MongoDB order FIRST (database-first approach)
    // This ensures we have a database record before any payment can be processed
    const order = await Order.create({
      userId: userId || null,
      guestUserId: guestUserId || null,
      orderNumber,
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

    console.log("✅ Order created in MongoDB (database-first):", {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
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
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        });
        return NextResponse.json(
          { success: false, message: "Failed to create Razorpay order" },
          { status: 500 }
        );
      }

      console.log("✅ Razorpay order created:", razorpayOrder.id);

      // STEP 4: Immediately update MongoDB order with razorpayOrderId
      // CRITICAL: This MUST succeed or we have an orphan payment
      updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        {
          $set: {
            razorpayOrderId: razorpayOrder.id,
          },
        },
        { new: true }
      );

      if (!updatedOrder) {
        // CRITICAL PAYMENT ERROR: Razorpay order created but Mongo update failed
        console.error("🚨 CRITICAL PAYMENT ERROR");
        console.error({
          mongoOrderId: order._id.toString(),
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
          mongoOrderId: order._id.toString(),
          razorpayOrderId: razorpayOrder.id,
          timestamp: new Date().toISOString(),
        });
        throw new Error("CRITICAL: razorpayOrderId is null after update");
      }

      console.log("✅ Order updated with Razorpay order ID:", {
        orderId: updatedOrder._id.toString(),
        orderNumber: updatedOrder.orderNumber,
        razorpayOrderId: updatedOrder.razorpayOrderId,
      });
    } catch (error) {
      // CRITICAL: If Razorpay order was created but Mongo update failed, log and throw
      if (razorpayOrder && razorpayOrder.id && !updatedOrder) {
        console.error("🚨 CRITICAL PAYMENT ERROR");
        console.error({
          mongoOrderId: order._id.toString(),
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

    // If order was created but something failed, try to clean up
    if (error.code === 11000) {
      // Duplicate key error (order number or razorpay_order_id)
      return NextResponse.json(
        { success: false, message: "Order number conflict. Please try again." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
