import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // Validate request body
    const body = await req.json();
    if (!body || !body.address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    const { address } = body;
    const pin = address?.pin;

    // Validate PIN code
    if (!pin || !/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: "Valid 6-digit PIN code is required" },
        { status: 400 }
      );
    }

    // Check if API token is configured (support both DELHIVERY_API_KEY and DELHIVERY_API_TOKEN)
    const API_KEY = process.env.DELHIVERY_API_KEY || process.env.DELHIVERY_API_TOKEN;
    if (!API_KEY) {
      console.warn("⚠️ DELHIVERY_API_KEY or DELHIVERY_API_TOKEN is not configured. Delivery check will proceed with fallback.");
      // Don't block checkout - return success with message
      return NextResponse.json({
        serviceable: true,
        codAvailable: true,
        eta: null,
        shippingCharge: null,
        message: "Delivery will be confirmed after order placement.",
      });
    }

    // Call Delhivery API
    let res;
    try {
      res = await fetch(
        `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pin}`,
        {
          headers: {
            Authorization: `Token ${API_KEY}`,
          },
        }
      );
    } catch (fetchError) {
      // Network error - don't block checkout
      console.error("⚠️ Delhivery API network error (non-blocking):", fetchError);
      return NextResponse.json({
        serviceable: true,
        codAvailable: true,
        eta: null,
        shippingCharge: null,
        message: "Delivery will be confirmed after order placement.",
      });
    }

    // Check if the external API call was successful
    if (!res.ok) {
      console.error(`⚠️ Delhivery API error (non-blocking): ${res.status} ${res.statusText}`);
      // Don't block checkout - return success with message
      return NextResponse.json({
        serviceable: true,
        codAvailable: true,
        eta: null,
        shippingCharge: null,
        message: "Delivery will be confirmed after order placement.",
      });
    }

    // Parse response
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error("⚠️ Failed to parse Delhivery API response (non-blocking):", parseError);
      // Don't block checkout - return success with message
      return NextResponse.json({
        serviceable: true,
        codAvailable: true,
        eta: null,
        shippingCharge: null,
        message: "Delivery will be confirmed after order placement.",
      });
    }

    const pinData = data?.delivery_codes?.[0]?.postal_code;

    // If PIN is not serviceable
    if (!pinData || pinData.pre_paid !== "Y") {
      return NextResponse.json({
        serviceable: false,
        codAvailable: false,
        eta: null,
        shippingCharge: null,
      });
    }

    // PIN is serviceable
    return NextResponse.json({
      serviceable: true,
      codAvailable: pinData.cod === "Y",
      eta: 3,
      shippingCharge: 0,
    });
  } catch (error) {
    // Handle any unexpected errors - don't block checkout
    console.error("⚠️ Delivery check error (non-blocking):", error);
    // Return success response so checkout can proceed
    return NextResponse.json({
      serviceable: true,
      codAvailable: true,
      eta: null,
      shippingCharge: null,
      message: "Delivery will be confirmed after order placement.",
    });
  }
}