import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import Order from "@/app/models/Order";
import { calculateExchangeEligibility } from "../exchange-eligibility/route";

export async function POST(req, { params }) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const user = await getAuthUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find order and verify ownership
    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { userId: user._id },
        { guestUserId: user._id }
      ]
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check exchange eligibility
    const eligibility = calculateExchangeEligibility(order);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason || "Order is not eligible for exchange",
        },
        { status: 400 }
      );
    }

    // Check if exchange already requested
    if (order.exchangeRequested && order.exchangeStatus === "REQUESTED") {
      return NextResponse.json(
        {
          success: false,
          error: "Exchange request already submitted",
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { exchangeReason, exchangeType, exchangeVideoUrl } = body;

    // Validate video URL format (only if provided)
    if (exchangeVideoUrl && typeof exchangeVideoUrl === "string" && exchangeVideoUrl.trim().length > 0) {
      try {
        const videoUrlObj = new URL(exchangeVideoUrl);
        if (!videoUrlObj.protocol.startsWith("http")) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid video URL format. Please upload a valid video file.",
            },
            { status: 400 }
          );
        }
      } catch (urlError) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid video URL. Please upload a valid video file that meets all requirements (10-60 seconds, max 20 MB, MP4/WEBM/MOV format).",
          },
          { status: 400 }
        );
      }
    }

    if (!exchangeReason || exchangeReason.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Exchange reason is required. Please provide a detailed reason for your exchange request.",
        },
        { status: 400 }
      );
    }

    if (!exchangeType || !["SIZE", "COLOR", "DEFECT", "WRONG_ITEM"].includes(exchangeType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid exchange type is required. Please select one of: Size Change, Color Change, Defective Product, or Wrong Item Received.",
        },
        { status: 400 }
      );
    }

    // Create exchange request
    const updateData = {
      exchangeRequested: true,
      exchangeRequestedAt: new Date(),
      exchangeStatus: "REQUESTED",
      exchangeReason: exchangeReason.trim(),
      exchangeType: exchangeType,
    };

    // Only add video if provided
    if (exchangeVideoUrl && typeof exchangeVideoUrl === "string" && exchangeVideoUrl.trim().length > 0) {
      updateData.exchangeVideo = {
        url: exchangeVideoUrl,
        uploadedAt: new Date(),
      };
    }

    await Order.findByIdAndUpdate(orderId, { $set: updateData });

    return NextResponse.json({
      success: true,
      message: "Exchange request submitted successfully",
      exchangeStatus: "REQUESTED",
    });
  } catch (error) {
    console.error("[Exchange Request] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit exchange request" },
      { status: 500 }
    );
  }
}
