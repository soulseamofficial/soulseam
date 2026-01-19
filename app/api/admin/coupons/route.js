import { connectDB } from "../../../lib/db";
import Coupon from "../../../models/coupon";


export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    if (!body.code || !body.discount) {
      return Response.json(
        { message: "Coupon code & discount required" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.create({
      code: body.code.toUpperCase(),
      discount: body.discount,
      expiry: body.expiry ? new Date(body.expiry) : null,
      active: body.active ?? true
    });

    return Response.json(coupon);
  } catch (err) {
    console.error("Coupon POST error:", err);
    return Response.json(
      { message: "Failed to create coupon" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return Response.json(coupons);
  } catch (err) {
    console.error("Coupon GET error:", err);
    return Response.json(
      { message: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { message: "Coupon id required" },
        { status: 400 }
      );
    }

    await Coupon.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (err) {
    console.error("Coupon DELETE error:", err);
    return Response.json(
      { message: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
