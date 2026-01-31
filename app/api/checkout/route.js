import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import { sendOrderToDelhivery, isOrderSentToDelhivery, logVerificationInstructions } from "@/app/lib/delhivery";
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
      // Try multiple possible ID fields - prioritize id (from cart) then productId, then _id
      const productId = String(it.id || it.productId || it._id || `item-${index}`);
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
      if (!productId || productId === `item-${index}` || !name || price <= 0) {
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
    .filter((it, index) => {
      // More lenient validation - allow generated IDs if name and price are valid
      const hasValidId = it.productId && it.productId !== "";
      const hasValidName = it.name && it.name.trim() !== "";
      const hasValidPrice = it.price > 0;
      
      const isValid = hasValidId && hasValidName && hasValidPrice;
      
      if (!isValid) {
        console.warn("normalizeItems: Filtered out invalid item", {
          index,
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
    console.log("Checkout API: Received items", {
      itemsCount: body?.items?.length || 0,
      items: body?.items,
      itemsType: typeof body?.items,
      isArray: Array.isArray(body?.items),
    });
    
    const items = normalizeItems(body?.items);
    
    console.log("Checkout API: Normalized items", {
      normalizedCount: items.length,
      normalizedItems: items,
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
    } else {
      // COD: Mark as PENDING payment but CONFIRMED order (ready for delivery)
      paymentStatus = "PENDING";
      orderStatus = "CONFIRMED";
    }

    // Prepare customer info for legacy fields
    const fullName = shippingAddress.fullName || "";
    const [firstName, ...rest] = fullName.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    // Create order directly
    const order = await Order.create({
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
      shipping: 0,
      totalAmount,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,

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
    });

    // Send order to Delhivery ONLY when orderStatus is CONFIRMED
    let delhiveryResponse = null;
    if (orderStatus === "CONFIRMED") {
      try {
        // Check if order was already sent to Delhivery (idempotent check)
        if (isOrderSentToDelhivery(order)) {
          console.log("⚠️ Order already sent to Delhivery, skipping:", order._id);
        } else {
          // Prepare order data for Delhivery
          delhiveryResponse = await sendOrderToDelhivery({
            orderId: order._id.toString(),
            shippingAddress: {
              fullName: shippingAddress.fullName || "",
              firstName: firstName || "",
              lastName: lastName || "",
              phone: shippingAddress.phone || "",
              addressLine1: shippingAddress.addressLine1 || "",
              addressLine2: shippingAddress.addressLine2 || "",
              city: shippingAddress.city || "",
              state: shippingAddress.state || "",
              pincode: shippingAddress.pincode || "",
              country: shippingAddress.country || "India",
            },
            paymentMethod: paymentMethod,
            items: items.map(item => ({
              name: item.name,
              quantity: item.quantity,
            })),
            totalAmount: totalAmount,
          });

          // Update order with Delhivery response
          const updateData = {};
          
          if (delhiveryResponse?.success) {
            // Success: Store Delhivery tracking details
            updateData.delhiveryWaybill = delhiveryResponse.waybill;
            updateData.delhiveryCourierName = delhiveryResponse.courier_name;
            updateData.delhiveryDeliveryStatus = delhiveryResponse.delivery_status;
            updateData.delhiveryTrackingUrl = delhiveryResponse.tracking_url;
            updateData.delhiverySent = true;
            updateData.delhiveryError = null;
            
            // Standardized delivery fields
            updateData.delivery_provider = "DELHIVERY";
            updateData.delivery_status = delhiveryResponse.delivery_status || "CREATED";
            updateData.shipment_status = delhiveryResponse.shipment_status || "SHIPPED"; // Set to SHIPPED on success
            
            // Legacy fields for backward compatibility
            updateData.delhiveryAWB = delhiveryResponse.waybill;
            updateData.delhiveryTrackingId = delhiveryResponse.waybill;
            updateData.delhiveryPartner = delhiveryResponse.courier_name;
            
            // Log verification instructions if real waybill (not mock)
            if (!delhiveryResponse.isMock && delhiveryResponse.waybill) {
              logVerificationInstructions(delhiveryResponse.waybill);
            }
            
            console.log("✅ Order sent to Delhivery successfully:", {
              orderId: order._id,
              waybill: delhiveryResponse.waybill,
              isMock: delhiveryResponse.isMock || false,
            });
          } else {
            // Failure: Mark as PENDING but keep order as CONFIRMED (order doesn't fail)
            updateData.delhiverySent = false;
            updateData.delhiveryError = delhiveryResponse?.error || "Unknown error";
            updateData.delhiveryDeliveryStatus = "PENDING";
            updateData.delivery_provider = "DELHIVERY"; // Still mark provider even on failure
            updateData.delivery_status = "PENDING";
            updateData.shipment_status = delhiveryResponse?.shipment_status || "PENDING"; // Set to PENDING on failure
            
            // Log full Delhivery response for debugging
            console.error("❌ Failed to send order to Delhivery (order still confirmed, status: PENDING):", {
              orderId: order._id,
              error: updateData.delhiveryError,
              delhiveryResponse: delhiveryResponse?.rawResponse || delhiveryResponse,
            });
          }

          // Update order with Delhivery response
          await Order.findByIdAndUpdate(order._id, { $set: updateData });
        }
      } catch (delhiveryError) {
        // Log error but don't fail the order creation
        console.error("❌ Delhivery creation error (non-blocking):", delhiveryError);
        
        // Mark order as PENDING (order doesn't fail, shipment status is PENDING)
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            delhiverySent: false,
            delhiveryError: delhiveryError.message || "Unknown error",
            delhiveryDeliveryStatus: "PENDING",
            delivery_provider: "DELHIVERY",
            delivery_status: "PENDING",
            shipment_status: "PENDING", // Set shipment_status to PENDING on error
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        orderId: order._id.toString(),
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        delhivery: delhiveryResponse?.success
          ? {
              waybill: delhiveryResponse.waybill,
              trackingUrl: delhiveryResponse.tracking_url,
              courierName: delhiveryResponse.courier_name,
            }
          : null,
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
