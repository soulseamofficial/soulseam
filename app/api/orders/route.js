import { NextResponse } from "next/server";
import Order from "../../models/Order";
import { connectDB } from "../../lib/db";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const order = await Order.create(body);

    return NextResponse.json(
      { success: true, orderId: order._id },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}