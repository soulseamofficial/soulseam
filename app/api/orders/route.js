import { NextResponse } from "next/server";
import Order from "../../models/Order";
import { connectDB } from "../../lib/db";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // razorpayOrderId is now required - validate it's provided
    if (!body.razorpayOrderId) {
      return NextResponse.json(
        { success: false, message: "razorpayOrderId is required" },
        { status: 400 }
      );
    }

    const order = await Order.create({
      ...body,
      orderStatus: body.orderStatus || "CREATED", // Use valid enum value
      payment: { method: "not_selected", status: "not_selected" },
      deliveryStatus: "not_created",
    });

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