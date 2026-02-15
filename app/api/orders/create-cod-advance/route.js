import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import { getNextOrderNumber } from "@/app/lib/getNextOrderNumber";
import Settings from "@/app/models/Settings";

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
 * POST /api/orders/create-cod-advance
 * 
 * FAIL-SAFE COD ADVANCE ORDER CREATION
 * 
 * Creates order in MongoDB BEFORE Razorpay advance payment
 * 
 * Features:
 * ✅ Order created FIRST in DB (fail-safe)
 * ✅ Razorpay advance order created AFTER DB order exists
 * ✅ Webhook will ONLY update payment status (never creates orders)
 * ✅ No order can ever be missed
 * 
 * Flow:
 * 1. Validate COD advance settings
 * 2. Create order in MongoDB with paymentStatus: "PENDING", orderStatus: "CREATED"
 * 3. Create Razorpay order for advance amount
 * 4. Update order with razorpayOrderId
 * 5. Return razorpay_order_id for frontend payment
 */
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    console.log("📦 CREATE COD ADVANCE ORDER API: Request received", {
      itemsCount: body?.items?.length || 0,
    });

    // STEP 1: Validate COD advance settings
    const settings = await Settings.getSettings();
    if (!settings.codAdvanceEnabled) {
      return NextResponse.json(
        { success: false, message: "COD advance payment is not enabled" },
        { status: 400 }
      );
    }

    const advanceAmount = settings.codAdvanceAmount;
    if (!advanceAmount || advanceAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid COD advance amount configuration" },
        { status: 400 }
      );
    }

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

    // Calculate COD advance fields
    const remainingCOD = Math.max(0, totalAmount - advanceAmount);

    // STEP 2: Create MongoDB order FIRST (BEFORE Razorpay payment)
    // This ensures we have a database record before any payment can be processed
    let order = null;
    let retries = 1; // Allow 1 retry (2 total attempts)
    let orderNumber = null;
    
    while (retries >= 0) {
      try {
        // Generate order number INSIDE loop (never reuse - gaps are acceptable)
        orderNumber = await getNextOrderNumber();
        
        console.log("🔄 COD Advance order creation attempt:", {
          orderNumber,
          retriesRemaining: retries
        });
        
        order = await Order.create({
          userId: userId || null,
          guestUserId: guestUserId || null,
          orderNumber,
          items,
          shippingAddress,
          paymentMethod: "COD",
          paymentStatus: "PENDING", // NOT PAID - will be updated to PARTIALLY_PAID by webhook
          orderStatus: "CREATED", // Will be updated when advance is paid
          coupon: coupon?.code ? coupon : null,
          subtotal,
          discount,
          discountAmount: discount,
          shipping: 0,
          totalAmount,
          finalTotal: totalAmount,
          advanceAmount: advanceAmount, // Expected advance amount
          advancePaid: 0, // Will be updated by webhook
          remainingCOD: remainingCOD,
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
            method: "COD",
            status: "pending",
          },
          legacyOrderStatus: "created",
        });
        
        // Order created successfully - break out of retry loop
        console.log("✅ COD Advance order created successfully:", {
          orderNumber: order.orderNumber,
        });
        break;
      } catch (error) {
        // Handle duplicate key errors (orderNumber conflict)
        if (error.code === 11000) {
          const duplicateField = error.keyPattern?.orderNumber ? 'orderNumber' : 'unknown';
          
          console.log("⚠️ Duplicate key error detected:", {
            field: duplicateField,
            orderNumber,
            retriesRemaining: retries
          });
          
          // Retry with new order number
          if (retries > 0) {
            retries--;
            console.log("🔄 Retrying with new order number:", {
              retriesRemaining: retries
            });
            continue; // Retry with new order number (generated at start of loop)
          } else {
            // Exhausted retries - throw error
            console.error("❌ Max retries reached for COD advance order creation:", {
              orderNumber,
              error: error.message
            });
            throw error;
          }
        } else {
          // Non-duplicate error - throw immediately
          console.error("❌ Non-duplicate error during COD advance order creation:", {
            orderNumber,
            error: error.message
          });
          throw error;
        }
      }
    }
    
    if (!order) {
      throw new Error("Failed to create COD advance order after retries");
    }

    console.log("✅ COD Advance order created in MongoDB (database-first):", {
      orderNumber: order.orderNumber,
    });

    // STEP 3 & 4: Create Razorpay order for advance amount AND update MongoDB
    // CRITICAL: If Razorpay order is created but Mongo update fails, we MUST throw error
    let razorpayOrder = null;
    let updatedOrder = null;

    try {
      // STEP 3: Create Razorpay order AFTER successful DB save
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("❌ Razorpay configuration missing after COD advance order creation");
        return NextResponse.json(
          { success: false, message: "Razorpay configuration missing" },
          { status: 500 }
        );
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      // Create Razorpay order for advance amount only
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(advanceAmount * 100), // Convert to paise
        currency: "INR",
        receipt: `rcpt_cod_advance_${orderNumber}_${Date.now()}`,
        notes: {
          mongoOrderId: order._id.toString(),
          orderNumber: orderNumber,
          orderType: "cod_advance",
        },
      });

      if (!razorpayOrder || !razorpayOrder.id) {
        console.error("❌ Failed to create Razorpay advance order after DB order creation", {
          orderNumber: order.orderNumber,
        });
        return NextResponse.json(
          { success: false, message: "Failed to create Razorpay advance order" },
          { status: 500 }
        );
      }

      console.log("✅ Razorpay advance order created:", {
        razorpayOrderId: razorpayOrder.id,
        orderNumber: order.orderNumber,
        advanceAmount: advanceAmount,
      });

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
        console.error("🚨 CRITICAL PAYMENT ERROR - COD Advance");
        console.error({
          orderNumber: order.orderNumber,
          razorpayOrderId: razorpayOrder.id,
          timestamp: new Date().toISOString(),
        });
        throw new Error("CRITICAL: Failed to update order with razorpayOrderId. Razorpay order created but DB update failed.");
      }

      // SAFETY CHECK: Verify razorpayOrderId is actually set
      if (!updatedOrder.razorpayOrderId) {
        console.error("🚨 CRITICAL PAYMENT ERROR - COD Advance");
        console.error({
          orderNumber: order.orderNumber,
          razorpayOrderId: razorpayOrder.id,
          timestamp: new Date().toISOString(),
        });
        throw new Error("CRITICAL: razorpayOrderId is null after update");
      }

      console.log("✅ COD Advance order updated with Razorpay order ID:", {
        orderNumber: updatedOrder.orderNumber,
      });
    } catch (error) {
      // CRITICAL: If Razorpay order was created but Mongo update failed, log and throw
      if (razorpayOrder && razorpayOrder.id && !updatedOrder) {
        console.error("🚨 CRITICAL PAYMENT ERROR - COD Advance");
        console.error({
          orderNumber: order.orderNumber,
          razorpayOrderId: razorpayOrder.id,
          timestamp: new Date().toISOString(),
          error: error.message,
        });
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
      amountInRupees: advanceAmount,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("❌ CREATE COD ADVANCE ORDER ERROR:", {
      error: error.message,
      stack: error.stack,
    });

    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      const duplicateField = error.keyPattern?.orderNumber ? 'orderNumber' : 
                             error.keyPattern?.razorpayOrderId ? 'razorpayOrderId' : 'unknown';
      
      console.error("❌ Duplicate key error (unrecoverable):", {
        field: duplicateField,
        error: error.message
      });
      
      return NextResponse.json(
        { success: false, message: "Unable to process order. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to create COD advance order" },
      { status: 500 }
    );
  }
}
