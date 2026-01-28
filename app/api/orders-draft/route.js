import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import OrderDraft from "@/app/models/OrderDraft";
import { getAuthUserFromCookies } from "@/app/lib/auth";

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
    const userId = authed?._id?.toString() || null;
    const guestUserId =
      !userId && typeof body?.guestUserId === "string" ? body.guestUserId.trim() : null;

    // Checkout must never block: we only validate minimally to avoid garbage writes.
    if (!userId && !guestUserId) {
      return NextResponse.json({ message: "userId or guestUserId required" }, { status: 400 });
    }

    const shippingAddress = normalizeAddress(body?.shippingAddress);
    if (!shippingAddress) {
      return NextResponse.json({ message: "Valid shippingAddress required" }, { status: 400 });
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

    if (draftId) {
      const query = { _id: draftId, ...(userId ? { userId } : { guestUserId }) };
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
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

