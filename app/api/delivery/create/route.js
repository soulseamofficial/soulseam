import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    if (process.env.DELIVERY_PROVIDER === "mock") {
        return NextResponse.json({
          success: true,
          deliveryPartner: "Delhivery-Mock",
          awb: "MOCK" + Date.now(),
          trackingId: "MOCK" + Date.now(),
          pickupScheduled: true,
        });
      }
    const body = await req.json();

    const {
      orderId,
      shippingAddress,
      paymentMethod,
      items,
      orderValue,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID missing" },
        { status: 400 }
      );
    }

    // ----------------------------
    // DELHIVERY CONFIG
    // ----------------------------
    const BASE_URL = process.env.DELHIVERY_API_BASE_URL;
    const TOKEN = process.env.DELHIVERY_API_TOKEN;

    // ----------------------------
    // PAYLOAD (Delhivery format)
    // ----------------------------
    const payload = {
      pickup_location: {
        name: process.env.DELHIVERY_PICKUP_NAME,
        phone: process.env.DELHIVERY_PICKUP_PHONE,
        pin: process.env.DELHIVERY_PICKUP_PINCODE,
        address: process.env.DELHIVERY_PICKUP_ADDRESS,
        city: process.env.DELHIVERY_PICKUP_CITY,
        state: process.env.DELHIVERY_PICKUP_STATE,
      },
      shipments: [
        {
          order: orderId,
          payment_mode: paymentMethod === "cod" ? "COD" : "Prepaid",
          total_amount: orderValue,
          name: shippingAddress.firstName + " " + shippingAddress.lastName,
          weight: 0.5, // ✅ MUST (kg)
          phone: shippingAddress.phone,
          add: shippingAddress.address,
          pin: shippingAddress.pin,
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: "India",
          products_desc: items.map(i => i.name).join(", "),
          quantity: items.reduce((s, i) => s + i.quantity, 0),
        },
      ],
    };

    // ----------------------------
    // DELHIVERY API CALL
    // ----------------------------
    const res = await fetch(`${BASE_URL}/api/cmu/create.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data?.packages?.[0]?.waybill) {
      return NextResponse.json(
        { success: false, message: "Delhivery order creation failed" },
        { status: 500 }
      );
    }

    const waybill = data.packages[0].waybill;

    return NextResponse.json({
      success: true,
      deliveryPartner: "Delhivery",
      awb: waybill,
      trackingId: waybill,
      pickupScheduled: true,
    });

  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}