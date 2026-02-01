export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import OTP from "../../../../models/OTP";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import axios from "axios";

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

/**
 * Generate a cryptographically secure 6-digit OTP
 */
function generateOTP() {
  // Use crypto.randomInt for secure random number generation
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Mask OTP for logging (only show first and last digit)
 */
function maskOTP(otp) {
  if (!otp || otp.length !== 6) return "******";
  return `${otp[0]}****${otp[5]}`;
}

export async function POST(req) {
  try {
    await connectDB();

    const { phone } = await req.json();
    const ipAddress = getClientIP(req);

    // Validate phone number
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { message: "Valid 10-digit Indian phone number required" },
        { status: 400 }
      );
    }

    // Rate limiting: Check recent requests from this IP
    const recentRequests = await OTP.countDocuments({
      ipAddress,
      channel: "whatsapp",
      createdAt: { $gte: new Date(Date.now() - RATE_LIMIT_WINDOW) },
    });

    if (recentRequests >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Check resend cooldown: Find the most recent OTP for this phone
    const lastOTP = await OTP.findOne({
      identifier: phone,
      channel: "whatsapp",
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

    // Invalidate previous OTPs for this phone/channel
    await OTP.updateMany(
      { identifier: phone, channel: "whatsapp", verified: false },
      { verified: true } // Mark as "used" (invalidated)
    );

    // Create new OTP record
    const otpRecord = await OTP.create({
      identifier: phone,
      channel: "whatsapp",
      otpHash,
      expiresAt,
      ipAddress,
      lastSentAt: new Date(),
    });

    // Send OTP via Meta WhatsApp Cloud API or development fallback
    const whatsappPhoneNumber = `91${phone}`;
    const otpMessage = `Your SoulSeam verification code is ${otp}. This code is valid for 5 minutes. Do not share it with anyone.`;

    // Check for WhatsApp API credentials
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    // Development/Testing: Log OTP to console if credentials not configured
    if (!phoneNumberId || !accessToken) {
      if (process.env.NODE_ENV === "development") {
        console.log(`\n[DEV] WhatsApp OTP for +91${phone}: ${otp}`);
        console.log(`[DEV] OTP Message: ${otpMessage}\n`);
        return NextResponse.json({
          message: "Verification code sent via WhatsApp",
          success: true,
          // Return OTP in development mode for UI display (only in dev)
          devOtp: otp,
          devMessage: "⚠️ WhatsApp API not configured. OTP shown below for testing.",
        });
      } else {
        // Production: Return error if credentials missing
        console.error("WhatsApp API configuration missing: WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set");
        // Delete the OTP record since we can't send it
        await OTP.deleteOne({ _id: otpRecord._id });
        return NextResponse.json(
          { 
            message: "WhatsApp service is currently unavailable. Please use email or phone verification instead.",
            error: "SERVICE_UNAVAILABLE"
          },
          { status: 503 }
        );
      }
    }

    // Production: Send via Meta WhatsApp Cloud API
    // Log masked OTP (production-safe)
    const maskedOTP = process.env.NODE_ENV === "production" ? maskOTP(otp) : otp;
    console.log(`[WhatsApp OTP] Sending to ${phone}: ${maskedOTP}`);

    try {
      // Meta WhatsApp Cloud API endpoint
      const apiUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

      const response = await axios.post(
        apiUrl,
        {
          messaging_product: "whatsapp",
          to: whatsappPhoneNumber,
          type: "text",
          text: {
            body: otpMessage,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Check if response contains message ID (success indicator)
      const messageId = response.data?.messages?.[0]?.id;

      if (!messageId) {
        console.error("WhatsApp API error: No message ID in response", response.data);
        // Delete the OTP record since sending failed
        await OTP.deleteOne({ _id: otpRecord._id });
        return NextResponse.json(
          { message: "Failed to send OTP. Please try again." },
          { status: 500 }
        );
      }

      // Success - message was sent
      console.log(`[WhatsApp OTP] Successfully sent to ${phone}, Message ID: ${messageId}`);

      return NextResponse.json({
        message: "Verification code sent via WhatsApp",
        success: true,
      });
    } catch (error) {
      // Handle axios errors
      const errorMessage = error.response?.data?.error?.message || error.message;
      const errorCode = error.response?.data?.error?.code;
      const errorType = error.response?.data?.error?.type;

      console.error("WhatsApp API error:", {
        message: errorMessage,
        code: errorCode,
        type: errorType,
        phone: phone,
      });

      // Delete the OTP record since sending failed
      await OTP.deleteOne({ _id: otpRecord._id });

      // Handle specific error codes
      if (errorCode === 190 || errorType === "OAuthException") {
        // Token expired or invalid
        console.error("⚠️ WhatsApp Access Token is invalid or expired.");
        console.error("   Please generate a new access token from Meta Developer Dashboard:");
        console.error("   https://developers.facebook.com/apps/");
        console.error("   Update WHATSAPP_ACCESS_TOKEN in your .env.local file");
        
        // In development, provide helpful error message
        if (process.env.NODE_ENV === "development") {
          return NextResponse.json(
            { 
              message: "WhatsApp authentication failed. Access token is invalid or expired.",
              error: "INVALID_TOKEN",
              devMessage: "Please generate a new access token from Meta Developer Dashboard and update WHATSAPP_ACCESS_TOKEN in .env.local"
            },
            { status: 500 }
          );
        } else {
          return NextResponse.json(
            { message: "WhatsApp service is temporarily unavailable. Please use email or phone verification instead." },
            { status: 503 }
          );
        }
      }

      // Return appropriate error message
      if (error.response?.status === 401) {
        return NextResponse.json(
          { message: "WhatsApp authentication failed. Please contact support." },
          { status: 500 }
        );
      } else if (error.response?.status === 429) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          { message: "Failed to send OTP. Please try again." },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("WhatsApp OTP send error:", error);
    return NextResponse.json(
      { message: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
