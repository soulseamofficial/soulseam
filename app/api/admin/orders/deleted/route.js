import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import mongoose from "mongoose";

export async function GET(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Validate pagination params
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100);

    // Calculate skip
    const skip = (validPage - 1) * validLimit;

    // Fetch only deleted orders
    const filter = {
      isDeleted: true
    };

    const orders = await Order.find(filter)
      .select("_id orderNumber userId guestUserId customer shippingAddress paymentMethod paymentStatus orderStatus subtotal discount discountAmount totalAmount finalTotal total items coupon createdAt deletedAt deletedBy")
      .populate("deletedBy", "email name")
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(validLimit)
      .lean();

    // Get total count
    const total = await Order.countDocuments(filter);
    const pages = Math.ceil(total / validLimit);

    return NextResponse.json({
      success: true,
      orders: Array.isArray(orders) ? orders : [],
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("[Deleted Orders] Fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deleted orders", orders: [] },
      { status: 500 }
    );
  }
}
