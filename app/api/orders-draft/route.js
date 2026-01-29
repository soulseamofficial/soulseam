import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import OrderDraft from "@/app/models/OrderDraft";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import mongoose from "mongoose";

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => ({
      productId: String(it.productId || it._id || it.id || ""),
      name: String(it.name || ""),
      image: String(it.image || ""),
      size: String(it.size || ""),
      color: String(it.color || ""),
      price: Number(it.finalPrice ?? it.price ?? 0),
      quantity: Math.max(1, Number(it.quantity || 1)),
    }))
    .filter((it) => it.productId && it.name && it.price >= 0);
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
  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) return null;
  return { fullName, phone, addressLine1, addressLine2, city, state, pincode, country };
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const authed = await getAuthUserFromCookies();
    const userId = authed?._id || null;
    let guestUserId = null;
    
    // Handle guestUserId - can be string or ObjectId
    if (!userId && body?.guestUserId) {
      const guestIdValue = body.guestUserId;
      if (typeof guestIdValue === "string" && guestIdValue.trim()) {
        const guestIdStr = guestIdValue.trim();
        // Validate and convert to ObjectId
        if (mongoose.Types.ObjectId.isValid(guestIdStr)) {
          guestUserId = new mongoose.Types.ObjectId(guestIdStr);
        } else {
          return NextResponse.json({ message: "Invalid guestUserId format" }, { status: 400 });
        }
      } else if (guestIdValue instanceof mongoose.Types.ObjectId) {
        guestUserId = guestIdValue;
      }
    }

    // Checkout must never block: we only validate minimally to avoid garbage writes.
    if (!userId && !guestUserId) {
      console.error("OrderDraft creation failed: missing both userId and guestUserId", {
        hasAuth: !!authed,
        hasGuestUserId: !!body?.guestUserId,
        guestUserIdType: typeof body?.guestUserId
      });
      return NextResponse.json({ 
        message: "userId or guestUserId required. Please ensure you are logged in or have a valid guest session." 
      }, { status: 400 });
    }

    const shippingAddress = normalizeAddress(body?.shippingAddress);
    if (!shippingAddress) {
      console.error("OrderDraft creation failed: invalid shipping address", body?.shippingAddress);
      return NextResponse.json({ 
        message: "Valid shippingAddress required. Please ensure all required address fields are filled." 
      }, { status: 400 });
    }

    const items = normalizeItems(body?.items);
    const subtotal = Number(body?.subtotal ?? 0);
    const discount = Number(body?.discount ?? 0);
    const total = Number(body?.total ?? 0);

    const coupon =
      body?.coupon && typeof body.coupon === "object"
        ? {
            code: typeof body.coupon.code === "string" ? body.coupon.code.trim() : "",
            discount: Number(body.coupon.discount ?? discount ?? 0),
          }
        : null;

    const draftId = typeof body?.draftId === "string" ? body.draftId.trim() : "";

    if (draftId && mongoose.Types.ObjectId.isValid(draftId)) {
      const query = { 
        _id: new mongoose.Types.ObjectId(draftId), 
        ...(userId ? { userId } : { guestUserId }) 
      };
      const updated = await OrderDraft.findOneAndUpdate(
        query,
        {
          $set: {
            shippingAddress,
            items,
            coupon: coupon?.code ? coupon : null,
            subtotal,
            discount,
            total,
            status: "draft",
            paymentStatus: "pending",
          },
        },
        { new: true }
      );
      if (updated) return NextResponse.json({ draftId: updated._id.toString() });
      // If draft not found (stale client), fall through and create new.
    }

    const created = await OrderDraft.create({
      userId: userId || null,
      guestUserId: guestUserId || null,
      shippingAddress,
      items,
      coupon: coupon?.code ? coupon : null,
      subtotal,
      discount,
      total,
      status: "draft",
      paymentStatus: "pending",
    });

    return NextResponse.json({ draftId: created._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("❌ OrderDraft creation error:", error);
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      console.error("Validation errors:", messages);
      return NextResponse.json({ message: `Validation error: ${messages}` }, { status: 400 });
    }
    // Handle pre-validation hook errors
    if (error.message && error.message.includes("exactly one of userId or guestUserId")) {
      console.error("Pre-validation error: userId/guestUserId conflict");
      return NextResponse.json({ 
        message: "Order draft validation failed. Please refresh and try again." 
      }, { status: 400 });
    }
    return NextResponse.json({ 
      message: error.message || "Failed to create order draft. Please try again." 
    }, { status: 500 });
  }
}

