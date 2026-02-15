import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import mongoose from "mongoose";

export async function DELETE(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { orderIds } = await req.json();

    // Validate input
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "orderIds array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate all orderIds are valid ObjectIds
    const validOrderIds = orderIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    if (validOrderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid order IDs provided" },
        { status: 400 }
      );
    }

    // Convert to ObjectIds
    const objectIds = validOrderIds.map(id => new mongoose.Types.ObjectId(id));

    // Permanently delete orders (hard delete)
    const result = await Order.deleteMany({ _id: { $in: objectIds } });

    return NextResponse.json({
      success: true,
      message: `Successfully permanently deleted ${result.deletedCount} order(s)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("[Permanent Delete Orders] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to permanently delete orders" },
      { status: 500 }
    );
  }
}
