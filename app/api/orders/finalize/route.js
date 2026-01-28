import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/app/lib/db";
import OrderDraft from "@/app/models/OrderDraft";
import Order from "@/app/models/Order";
import { getAuthUserFromCookies } from "@/app/lib/auth";

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

    const draftId = typeof body?.draftId === "string" ? body.draftId.trim() : "";
    if (!draftId) return NextResponse.json({ message: "draftId required" }, { status: 400 });

    const paymentMethod = body?.paymentMethod === "COD" ? "COD" : body?.paymentMethod === "ONLINE" ? "ONLINE" : "";
    if (!paymentMethod) return NextResponse.json({ message: "paymentMethod must be COD or ONLINE" }, { status: 400 });

    const authed = await getAuthUserFromCookies();
    const userId = authed?._id?.toString() || null;
    const guestUserId = !userId && typeof body?.guestUserId === "string" ? body.guestUserId.trim() : null;

    const draft = await OrderDraft.findOne({
      _id: draftId,
      ...(userId ? { userId } : { guestUserId }),
    }).lean();
    if (!draft) return NextResponse.json({ message: "Draft not found" }, { status: 404 });

    // Verify payment for ONLINE
    let paymentStatus = "pending";
    let legacyPayment = { method: "", status: "" };

    if (paymentMethod === "COD") {
      paymentStatus = "cod";
      legacyPayment = { method: "COD", status: "pending" };
    } else {
      const ok = verifyRazorpaySignature({
        razorpay_order_id: body?.razorpay_order_id,
        razorpay_payment_id: body?.razorpay_payment_id,
        razorpay_signature: body?.razorpay_signature,
      });
      if (!ok) return NextResponse.json({ message: "Payment verification failed" }, { status: 400 });
      paymentStatus = "paid";
      legacyPayment = {
        method: "Razorpay",
        status: "paid",
        razorpayOrderId: body?.razorpay_order_id,
        razorpayPaymentId: body?.razorpay_payment_id,
      };
    }

    // Create final order (snapshot only)
    const shipping = draft.shippingAddress || {};
    const fullName = shipping.fullName || "";
    const [firstName, ...rest] = fullName.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    const order = await Order.create({
      userId: draft.userId || null,
      guestUserId: draft.guestUserId || null,
      shippingAddressSnapshot: draft.shippingAddress,
      coupon: draft.coupon || null,
      items: draft.items || [],
      subtotal: draft.subtotal,
      discount: draft.discount,
      shipping: 0,
      total: draft.total,
      paymentMethod,
      paymentStatus,
      orderStatus: "placed",

      // Legacy fields for existing admin UI
      customer: {
        email: authed?.email || "",
        firstName: firstName || "",
        lastName: lastName || "",
        phone: shipping.phone || "",
      },
      shippingAddress: {
        address: shipping.addressLine1 || "",
        apt: shipping.addressLine2 || "",
        city: shipping.city || "",
        state: shipping.state || "",
        pin: shipping.pincode || "",
        country: shipping.country || "",
      },
      payment: legacyPayment,
      legacyOrderStatus: paymentMethod === "ONLINE" ? "paid" : "created",
    });

    await OrderDraft.deleteOne({ _id: draftId });

    return NextResponse.json({ success: true, orderId: order._id.toString() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

