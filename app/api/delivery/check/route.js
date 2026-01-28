import { NextResponse } from "next/server";

export async function POST(req) {
  const { address } = await req.json();
  const pin = address.pin;

  const res = await fetch(
    `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pin}`,
    {
      headers: {
        Authorization: `Token ${process.env.DELHIVERY_API_TOKEN}`,
      },
    }
  );

  const data = await res.json();

  const pinData = data?.delivery_codes?.[0]?.postal_code;

  if (!pinData || pinData.pre_paid !== "Y") {
    return NextResponse.json({
      serviceable: false,
      codAvailable: false,
      eta: null,
      shippingCharge: null,
    });
  }

  return NextResponse.json({
    serviceable: true,
    codAvailable: pinData.cod === "Y",
    eta: 3,
    shippingCharge: 0,
  });
}