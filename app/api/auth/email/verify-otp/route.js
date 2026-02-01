import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import OTP from "../../../../models/OTP";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectDB();

    const { email, otp } = await req.json();

    // Validate inputs
    if (!email || !/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(email)) {
      return NextResponse.json(
        { message: "Valid email address required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!otp || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { message: "Valid 6-digit OTP required" },
        { status: 400 }
      );
    }

    // Find the most recent unverified OTP for this email
    const otpRecord = await OTP.findOne({
      identifier: normalizedEmail,
      channel: "email",
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return NextResponse.json(
        { message: "OTP not found or already used. Please request a new OTP." },
        { status: 404 }
      );
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      // Mark as verified (invalidated) to prevent reuse
      await OTP.updateOne({ _id: otpRecord._id }, { verified: true });
      return NextResponse.json(
        { message: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= 3) {
      // Mark as verified (invalidated) to prevent further attempts
      await OTP.updateOne({ _id: otpRecord._id }, { verified: true });
      return NextResponse.json(
        { message: "Maximum verification attempts exceeded. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isValid) {
      // Increment attempts
      await OTP.updateOne(
        { _id: otpRecord._id },
        { $inc: { attempts: 1 } }
      );

      const remainingAttempts = 3 - (otpRecord.attempts + 1);
      if (remainingAttempts > 0) {
        return NextResponse.json(
          { message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.` },
          { status: 401 }
        );
      } else {
        // Mark as verified (invalidated) after max attempts
        await OTP.updateOne({ _id: otpRecord._id }, { verified: true });
        return NextResponse.json(
          { message: "Maximum verification attempts exceeded. Please request a new OTP." },
          { status: 400 }
        );
      }
    }

    // OTP is valid - mark as verified and invalidate
    await OTP.updateOne({ _id: otpRecord._id }, { verified: true });

    return NextResponse.json({
      message: "OTP verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("Email OTP verify error:", error);
    return NextResponse.json(
      { message: "OTP verification failed. Please try again." },
      { status: 500 }
    );
  }
}
