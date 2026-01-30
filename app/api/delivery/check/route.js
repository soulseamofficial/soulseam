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

    // Check if API token is configured
    if (!process.env.DELHIVERY_API_TOKEN) {
      console.error("DELHIVERY_API_TOKEN is not configured");
      return NextResponse.json(
        { error: "Delivery service is not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Call Delhivery API
    const res = await fetch(
      `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pin}`,
      {
        headers: {
          Authorization: `Token ${process.env.DELHIVERY_API_TOKEN}`,
        },
      }
    );

    // Check if the external API call was successful
    if (!res.ok) {
      console.error(`Delhivery API error: ${res.status} ${res.statusText}`);
      return NextResponse.json(
        { error: "Unable to check delivery. Try again later." },
        { status: 502 }
      );
    }

    // Parse response
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error("Failed to parse Delhivery API response:", parseError);
      return NextResponse.json(
        { error: "Invalid response from delivery service. Try again later." },
        { status: 502 }
      );
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
    // Handle any unexpected errors
    console.error("Delivery check error:", error);
    return NextResponse.json(
      { error: "Unable to check delivery. Try again later." },
      { status: 500 }
    );
  }
}