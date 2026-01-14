import mongoose from "mongoose";
import Coupon from "../../../models/coupon.js";

export async function POST(req) {
  await mongoose.connect(process.env.MONGODB_URI);

  const body = await req.json();

  const coupon = await Coupon.create({
    code: body.code.toUpperCase(),
    discount: body.discount,
    expiry: new Date(body.expiry),
    active: body.active ?? true
  });

  return Response.json(coupon);
}

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URI);

  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return Response.json(coupons);
}

export async function DELETE(req) {
  await mongoose.connect(process.env.MONGODB_URI);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  await Coupon.findByIdAndDelete(id);
  return Response.json({ success: true });
}
