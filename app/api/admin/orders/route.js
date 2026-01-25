import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";

export async function GET() {
  try {
    await connectDB();

    const orders = await Order.find({})
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Admin orders fetch error:", error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}