import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import User from "@/app/models/User";
import Coupon from "@/app/models/coupon";
import Settings from "@/app/models/Settings";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import { reduceStockForOrderItems } from "@/app/lib/stockManager";
import mongoose from "mongoose";
import crypto from "crypto";

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    console.error("normalizeItems: items is not an array", items);
    return [];
  }
  
  if (items.length === 0) {
    console.error("normalizeItems: items array is empty");
    return [];
  }

  console.log("normalizeItems: Processing items", {
    count: items.length,
    firstItem: items[0],
    allItems: items,
  });

  const normalized = items
    .map((it, index) => {
      // 🔥 FIX: Try multiple possible ID fields - prioritize productId, then _id, then id
      // DO NOT create fallback IDs like "item-0" - reject invalid items instead
      const rawProductId = it.productId || it._id || it.id;
      
      // Validate that we have a productId
      if (!rawProductId) {
        console.error("normalizeItems: Item missing productId/_id/id", {
          index,
          item: it,
        });
        return null; // Return null to filter out
      }

      const productId = String(rawProductId);
      
      // 🔥 CRITICAL: Validate ObjectId format BEFORE processing
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        console.error("normalizeItems: Invalid ObjectId format", {
          index,
          productId,
          originalItem: it,
        });
        return null; // Return null to filter out
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
      
      // Log if critical fields are missing
      if (!name || price <= 0) {
        console.warn("normalizeItems: Item missing required fields", {
          index,
          productId,
          name,
          price,
          originalItem: it,
          normalizedItem,
        });
      }
      
      return normalizedItem;
    })
    .filter((it) => {
      // Filter out null items (invalid productIds)
      if (!it) return false;
      
      // Validate required fields
      const hasValidId = it.productId && mongoose.Types.ObjectId.isValid(it.productId);
      const hasValidName = it.name && it.name.trim() !== "";
      const hasValidPrice = it.price > 0;
      
      const isValid = hasValidId && hasValidName && hasValidPrice;
      
      if (!isValid) {
        console.warn("normalizeItems: Filtered out invalid item", {
          item: it,
          reasons: {
            hasValidId,
            hasValidName,
            hasValidPrice,
          },
        });
      }
      
      return isValid;
    });

  console.log("normalizeItems: Result", {
    originalCount: items.length,
    normalizedCount: normalized.length,
    normalizedItems: normalized,
  });

  if (normalized.length === 0) {
    console.error("normalizeItems: All items were filtered out. Original items:", items);
  }

  return normalized;
}

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

function verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === razorpay_signature;
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Get authenticated user
    const authed = await getAuthUserFromCookies();
    const userId = authed?._id || null;
    let guestUserId = null;

    // Handle guestUserId - can be string or ObjectId
    if (!userId && body?.guestUserId) {
      const guestIdValue = body.guestUserId;
      if (typeof guestIdValue === "string" && guestIdValue.trim()) {
        const guestIdStr = guestIdValue.trim();
        if (mongoose.Types.ObjectId.isValid(guestIdStr)) {
          guestUserId = new mongoose.Types.ObjectId(guestIdStr);
        } else {
          return NextResponse.json({ message: "Invalid guestUserId format" }, { status: 400 });
        }
      } else if (guestIdValue instanceof mongoose.Types.ObjectId) {
        guestUserId = guestIdValue;
      }
    }

    // Validate user or guest
    if (!userId && !guestUserId) {
      return NextResponse.json(
        { message: "userId or guestUserId required" },
        { status: 400 }
      );
    }

    // Validate shipping address
    const shippingAddress = normalizeAddress(body?.shippingAddress);
    if (!shippingAddress) {
      return NextResponse.json(
        { message: "Valid shippingAddress required. Please ensure all required address fields are filled." },
        { status: 400 }
      );
    }

    // Validate items
    console.log("🔍 Checkout API: Received items", {
      itemsCount: body?.items?.length || 0,
      items: body?.items,
      itemsType: typeof body?.items,
      isArray: Array.isArray(body?.items),
      // 🔥 DEBUG: Log product IDs to verify they're valid ObjectIds
      productIds: body?.items?.map((it, idx) => ({
        index: idx,
        id: it.id,
        productId: it.productId,
        _id: it._id,
        isValid: it.id ? mongoose.Types.ObjectId.isValid(it.id) : 
                 it.productId ? mongoose.Types.ObjectId.isValid(it.productId) :
                 it._id ? mongoose.Types.ObjectId.isValid(it._id) : false,
      })),
    });
    
    const items = normalizeItems(body?.items);
    
    console.log("✅ Checkout API: Normalized items", {
      normalizedCount: items.length,
      normalizedItems: items,
      // 🔥 DEBUG: Verify all productIds are valid ObjectIds
      productIds: items.map((it) => ({
        productId: it.productId,
        isValid: mongoose.Types.ObjectId.isValid(it.productId),
        name: it.name,
      })),
    });
    
    if (items.length === 0) {
      console.error("Checkout API: No valid items after normalization", {
        originalItems: body?.items,
        bodyKeys: Object.keys(body || {}),
      });
      return NextResponse.json(
        { 
          message: "At least one item is required",
          debug: process.env.NODE_ENV === "development" ? {
            receivedItems: body?.items,
            normalizedItems: items,
          } : undefined,
        },
        { status: 400 }
      );
    }

    // Validate payment method
    const paymentMethod = body?.paymentMethod === "COD" ? "COD" : body?.paymentMethod === "ONLINE" ? "ONLINE" : "";
    if (!paymentMethod) {
      return NextResponse.json(
        { message: "paymentMethod must be COD or ONLINE" },
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
        { message: "Invalid amount values" },
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

    // Determine payment status and order status based on payment method
    let paymentStatus = "PENDING";
    let orderStatus = "CREATED";
    let razorpayOrderId = null;
    let razorpayPaymentId = null;
    let razorpaySignature = null;
    let advancePaid = 0;
    let remainingCOD = totalAmount;

    if (paymentMethod === "ONLINE") {
      // Verify Razorpay payment for ONLINE
      razorpayOrderId = body?.razorpay_order_id || body?.razorpayOrderId || null;
      razorpayPaymentId = body?.razorpay_payment_id || body?.razorpayPaymentId || null;
      razorpaySignature = body?.razorpay_signature || body?.razorpaySignature || null;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json(
          { message: "Razorpay payment details required for ONLINE payment" },
          { status: 400 }
        );
      }

      const isValid = verifyRazorpaySignature({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      });

      if (!isValid) {
        return NextResponse.json(
          { message: "Payment verification failed" },
          { status: 400 }
        );
      }

      // ONLINE payment verified: Mark as PAID and CONFIRMED
      paymentStatus = "PAID";
      orderStatus = "CONFIRMED";
      advancePaid = totalAmount;
      remainingCOD = 0;
    } else {
      // COD: Check if advance payment is required
      const settings = await Settings.getSettings();
      
      if (settings.codAdvanceEnabled) {
        // COD advance is enabled - require advance payment verification
        razorpayOrderId = body?.razorpay_order_id || body?.razorpayOrderId || null;
        razorpayPaymentId = body?.razorpay_payment_id || body?.razorpayPaymentId || null;
        razorpaySignature = body?.razorpay_signature || body?.razorpaySignature || null;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
          return NextResponse.json(
            { message: `COD advance of ₹${settings.codAdvanceAmount} is required. Please complete the COD advance payment first.` },
            { status: 400 }
          );
        }

        // Verify Razorpay signature for advance payment
        const isValid = verifyRazorpaySignature({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
        });

        if (!isValid) {
          return NextResponse.json(
            { message: "COD advance payment verification failed" },
            { status: 400 }
          );
        }

        // Verify that the payment amount matches the advance amount
        // Note: We can't verify the exact amount from just the signature, but we trust Razorpay
        // The frontend should ensure the correct amount is sent
        
        // Advance payment verified
        advancePaid = settings.codAdvanceAmount;
        remainingCOD = Math.max(0, totalAmount - advancePaid);
        paymentStatus = "PENDING"; // Still PENDING because full amount not paid
        orderStatus = "CONFIRMED"; // Order confirmed after advance payment
      } else {
        // COD advance is disabled - allow order without advance
        paymentStatus = "PENDING";
        orderStatus = "CONFIRMED";
        advancePaid = 0;
        remainingCOD = totalAmount;
      }
    }

    // Prepare customer info for legacy fields
    const fullName = shippingAddress.fullName || "";
    const [firstName, ...rest] = fullName.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    // Extract order message (optional)
    const orderMessage = body?.orderMessage && typeof body.orderMessage === "string"
      ? body.orderMessage.trim().substring(0, 250)
      : null;

    // 🔥 STOCK REDUCTION: Prepare items for stock reduction
    const stockReductionItems = items.map((item) => ({
      productId: item.productId,
      size: item.size || "",
      quantity: item.quantity || 1,
    }));

    // 🔥 CRITICAL: Validate ObjectIds BEFORE attempting stock reduction
    const invalidItems = stockReductionItems.filter((item) => {
      if (!item.productId || !item.size) return true;
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        console.error("Checkout API: Invalid ObjectId in stock reduction item", {
          productId: item.productId,
          item,
        });
        return true;
      }
      return false;
    });

    if (invalidItems.length > 0) {
      console.error("Checkout API: Invalid items for stock reduction", {
        invalidItems,
        allItems: stockReductionItems,
      });
      return NextResponse.json(
        { 
          success: false,
          message: "Invalid product IDs detected. Please refresh and try again.",
          error: "Invalid product ID format",
        },
        { status: 400 }
      );
    }

    // 🔥 MONGODB TRANSACTION: Ensure atomic order creation and stock reduction
    const session = await mongoose.startSession();
    session.startTransaction();

    let order = null;
    try {
      // Create order within transaction
      order = await Order.create([{
        userId: userId || null,
        guestUserId: guestUserId || null,
        items,
        shippingAddress,
        paymentMethod,
        paymentStatus,
        orderStatus,
        coupon: coupon?.code ? coupon : null,
        subtotal,
        discount,
        discountAmount: discount, // Alias for clarity
        shipping: 0,
        totalAmount,
        finalTotal: totalAmount, // Alias for clarity
        advancePaid,
        remainingCOD,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        orderMessage: orderMessage || null,

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
          method: paymentMethod === "COD" ? "COD" : "Razorpay",
          status: paymentStatus === "PAID" ? "paid" : "pending",
          razorpayPaymentId: razorpayPaymentId || undefined,
        },
        legacyOrderStatus: orderStatus === "CONFIRMED" ? "paid" : "created",
      }], { session });

      order = order[0]; // Create returns an array when using session

      // 🔥 REDUCE STOCK: After order creation, reduce stock atomically (within transaction)
      const stockResult = await reduceStockForOrderItems(stockReductionItems, session);
      
      if (!stockResult.success) {
        // Stock reduction failed - rollback transaction
        await session.abortTransaction();
        await session.endSession();
        
        const errorMessage = stockResult.errors?.join(", ") || "Selected size is out of stock";
        return NextResponse.json(
          { 
            success: false,
            message: errorMessage,
            stockErrors: stockResult.errors,
          },
          { status: 400 }
        );
      }

      // ✅ All operations successful - commit transaction
      await session.commitTransaction();
      await session.endSession();
      
      console.log("✅ Order created and stock reduced successfully:", {
        orderId: order._id,
        itemsCount: items.length,
      });
    } catch (transactionError) {
      // Rollback on any error
      await session.abortTransaction();
      await session.endSession();
      
      console.error("❌ Transaction error:", transactionError);
      throw transactionError;
    }

    // Create order directly (OLD CODE - REMOVED, using transaction above)
    /* const order = await Order.create({
      userId: userId || null,
      guestUserId: guestUserId || null,
      items,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      orderStatus,
      coupon: coupon?.code ? coupon : null,
      subtotal,
      discount,
      discountAmount: discount, // Alias for clarity
      shipping: 0,
      totalAmount,
      finalTotal: totalAmount, // Alias for clarity
      advancePaid,
      remainingCOD,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderMessage: orderMessage || null,

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
        method: paymentMethod === "COD" ? "COD" : "Razorpay",
        status: paymentStatus === "PAID" ? "paid" : "pending",
        razorpayPaymentId: razorpayPaymentId || undefined,
      },
      legacyOrderStatus: orderStatus === "CONFIRMED" ? "paid" : "created",
    }); */

    // Update user orderCount and firstOrderCouponUsed when order is confirmed (logged-in users only)
    if (orderStatus === "CONFIRMED" && userId) {
      try {
        const userUpdate = { $inc: { orderCount: 1 } };
        
        // If first-order coupon was used, mark it as used
        if (coupon?.code) {
          const couponDoc = await Coupon.findOne({ code: coupon.code.toUpperCase().trim() });
          if (couponDoc && couponDoc.isFirstOrderCoupon === true) {
            userUpdate.$set = { firstOrderCouponUsed: true };
          }
        }
        
        await User.findByIdAndUpdate(userId, userUpdate);
        console.log("✅ Updated user orderCount and firstOrderCouponUsed:", userId);
      } catch (userUpdateError) {
        // Log error but don't fail the order creation
        console.error("❌ Failed to update user orderCount (non-blocking):", userUpdateError);
      }
    }

    // Shipment creation is now handled by admin - removed from checkout flow

    return NextResponse.json(
      {
        success: true,
        orderId: order._id.toString(),
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Checkout error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
