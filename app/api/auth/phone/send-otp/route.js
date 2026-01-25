import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { message: "Valid 10-digit phone number required" },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: process.env.MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: `91${phone}`,
        otp_length: 6,
        otp_expiry: 5, // minutes
      }),
    });

    const data = await res.json();

    if (data.type === "success") {
      return NextResponse.json({ message: "OTP sent successfully" });
    }

    return NextResponse.json(
      { message: data.message || "OTP send failed" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Server error while sending OTP" },
      { status: 500 }
    );
  }
}
