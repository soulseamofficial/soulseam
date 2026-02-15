import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import mongoose from "mongoose";

export async function PATCH(req) {
  // Verify admin authentication
  const { authorized, admin, error } = await requireAdminAuth(req);
  
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

    if (validOrderIds.length !== orderIds.length) {
      console.warn(`[Bulk Delete] Some invalid order IDs were filtered out: ${orderIds.length - validOrderIds.length} invalid IDs`);
    }

    // Convert to ObjectIds
    const objectIds = validOrderIds.map(id => new mongoose.Types.ObjectId(id));

    // Soft delete orders
    const result = await Order.updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: admin._id,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully moved ${result.modifiedCount} order(s) to trash`,
      deletedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("[Bulk Delete Orders] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete orders" },
      { status: 500 }
    );
  }
}
