export const runtime = "nodejs";

import { connectDB } from "../../lib/db";
import Product from "../../models/product";
import Order from "../../models/Order";

export async function POST(req) {
  try {
    await connectDB();

    const { productId, quantity, customerName } = await req.json();

    if (!productId || !quantity) {
      return Response.json(
        { message: "Missing data" },
        { status: 400 }
      );
    }

    // 🔒 ATOMIC STOCK CHECK + REDUCE
    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        stock: { $gte: quantity }, // stock enough?
      },
      {
        $inc: { stock: -quantity }, // reduce stock
      },
      { new: true }
    );

    if (!product) {
      return Response.json(
        { message: "Out of stock" },
        { status: 409 }
      );
    }

    // 💾 CREATE ORDER
    const order = await Order.create({
      productId,
      quantity,
      amount: product.price * quantity,
      customerName,
    });

    return Response.json({
      success: true,
      order,
      remainingStock: product.stock,
    });

  } catch (err) {
    console.error("ORDER ERROR:", err);
    return Response.json(
      { message: "Order failed" },
      { status: 500 }
    );
  }
}
