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

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const guestUserId = searchParams.get("guestUserId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const orderStatus = searchParams.get("orderStatus") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") || "desc";

    // Validate pagination params
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 per page

    // Calculate skip
    const skip = (validPage - 1) * validLimit;

    // Build query filter
    let filter = {};
    
    if (userId) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({
          success: false,
          error: "Invalid userId format",
          orders: []
        }, { status: 400 });
      }
      filter.userId = new mongoose.Types.ObjectId(userId);
    }

    if (guestUserId) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(guestUserId)) {
        return NextResponse.json({
          success: false,
          error: "Invalid guestUserId format",
          orders: []
        }, { status: 400 });
      }
      filter.guestUserId = new mongoose.Types.ObjectId(guestUserId);
    }

    // Add payment status filter
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Add order status filter
    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }

    // Add search filter (orderNumber or phone)
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "shippingAddress.phone": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } }
      ];
    }

    // Build sort object
    const sortObj = {
      [sortBy]: order === "asc" ? 1 : -1
    };

    // Fetch orders with pagination, filters, search, and sort
    // Use lean() for performance and select only needed fields
    const orders = await Order.find(filter)
      .select("_id orderNumber userId guestUserId customer shippingAddress paymentMethod paymentStatus orderStatus totalAmount finalTotal total items createdAt deliveredAt isShipmentCreated delhiveryWaybill delhiveryTrackingUrl delhiveryCourierName delhiveryPartner delivery_status advancePaid remainingCOD razorpayPaymentId orderMessage exchangeRequested exchangeStatus exchangeRequestedAt")
      .sort(sortObj)
      .skip(skip)
      .limit(validLimit)
      .lean();

    // Get total count for pagination (with all filters)
    const total = await Order.countDocuments(filter);

    // Calculate total pages
    const pages = Math.ceil(total / validLimit);

    // ALWAYS return array, never undefined
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
    console.error("[Admin Orders] Fetch error:", error);
    
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders", orders: [] },
      { status: 500 }
    );
  }
}