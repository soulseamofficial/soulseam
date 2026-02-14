import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Order from "../../../../models/Order";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    // Verify admin authentication
    const { authorized, error } = await requireAdminAuth(req);
    
    if (!authorized) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const guestUserId = searchParams.get("guestUserId");

    // Build filter
    let filter = {};
    
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({
          success: false,
          error: "Invalid userId format"
        }, { status: 400 });
      }
      filter.userId = new mongoose.Types.ObjectId(userId);
    }

    if (guestUserId) {
      if (!mongoose.Types.ObjectId.isValid(guestUserId)) {
        return NextResponse.json({
          success: false,
          error: "Invalid guestUserId format"
        }, { status: 400 });
      }
      filter.guestUserId = new mongoose.Types.ObjectId(guestUserId);
    }

    const count = await Order.countDocuments(filter);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch order count" },
      { status: 500 }
    );
  }
}