import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Order from "../../../../models/Order";

export async function GET() {
  try {
    await connectDB();
    const count = await Order.countDocuments();
    return NextResponse.json({ success: true, count });
  } catch (error) {
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}