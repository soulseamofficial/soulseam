import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import OTP from "../../../../models/OTP";
import bcrypt from "bcryptjs";
import { sendOTPEmail } from "../../../../lib/email";

// Rate limiting: Max 3 OTP requests per IP per 15 minutes
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 3;

// Resend cooldown: 30 seconds
const RESEND_COOLDOWN = 30 * 1000; // 30 seconds

function getClientIP(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIP || "unknown";
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

export async function POST(req) {
  try {
    await connectDB();

    const { email } = await req.json();
    const ipAddress = getClientIP(req);

    // Validate email
    if (!email || !/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(email)) {
      return NextResponse.json(
        { message: "Valid email address required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate limiting: Check recent requests from this IP
    const recentRequests = await OTP.countDocuments({
      ipAddress,
      channel: "email",
      createdAt: { $gte: new Date(Date.now() - RATE_LIMIT_WINDOW) },
    });

    if (recentRequests >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Check resend cooldown: Find the most recent OTP for this email
    const lastOTP = await OTP.findOne({
      identifier: normalizedEmail,
      channel: "email",
    }).sort({ createdAt: -1 });

    if (lastOTP && lastOTP.lastSentAt) {
      const timeSinceLastSend = Date.now() - new Date(lastOTP.lastSentAt).getTime();
      if (timeSinceLastSend < RESEND_COOLDOWN) {
        const remainingSeconds = Math.ceil((RESEND_COOLDOWN - timeSinceLastSend) / 1000);
        return NextResponse.json(
          { message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.` },
          { status: 429 }
        );
      }
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    // Expiry: 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Invalidate previous OTPs for this email/channel
    await OTP.updateMany(
      { identifier: normalizedEmail, channel: "email", verified: false },
      { verified: true } // Mark as "used" (invalidated)
    );

    // Create new OTP record
    const otpRecord = await OTP.create({
      identifier: normalizedEmail,
      channel: "email",
      otpHash,
      expiresAt,
      ipAddress,
      lastSentAt: new Date(),
    });

    // Send OTP via email
    const emailResult = await sendOTPEmail(normalizedEmail, otp);

    if (!emailResult.success) {
      // OTP is stored, but email failed
      // In production, you might want to use a queue/retry mechanism
      console.error("Failed to send email OTP:", emailResult.error);
      // Still return success - user can request resend if needed
    }

    return NextResponse.json({
      message: "Verification code sent via Email",
      success: true,
    });
  } catch (error) {
    console.error("Email OTP send error:", error);
    return NextResponse.json(
      { message: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
