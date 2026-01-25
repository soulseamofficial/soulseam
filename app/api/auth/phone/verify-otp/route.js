import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import User from "../../../../models/User";

export async function POST(req) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { message: "Phone and OTP required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=91${phone}`,
      {
        method: "POST",
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
        },
      }
    );

    const data = await res.json();

    if (data.type !== "success") {
      return NextResponse.json(
        { message: "Invalid OTP" },
        { status: 401 }
      );
    }

    // ✅ OTP verified → create / find user
    await connectDB();

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        provider: "phone",
        role: "user",
      });
    }

    return NextResponse.json({
      message: "Login successful",
      userId: user._id,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "OTP verification failed" },
      { status: 500 }
    );
  }
}
