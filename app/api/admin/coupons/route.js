import { connectDB } from "../../../lib/db";
import Coupon from "../../../models/coupon";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";

export async function POST(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await req.json();

    // Validate required fields
    if (!body.code || !body.discountType || body.discountValue === undefined || !body.expiryDate) {
      return NextResponse.json(
        { message: "Code, discountType, discountValue, and expiryDate are required" },
        { status: 400 }
      );
    }

    // Validate discountType
    if (!["percentage", "flat"].includes(body.discountType)) {
      return NextResponse.json(
        { message: "discountType must be 'percentage' or 'flat'" },
        { status: 400 }
      );
    }

    // Validate discountValue
    if (body.discountValue < 0) {
      return NextResponse.json(
        { message: "discountValue must be >= 0" },
        { status: 400 }
      );
    }

    // For percentage, validate discountValue <= 100
    if (body.discountType === "percentage" && body.discountValue > 100) {
      return NextResponse.json(
        { message: "Percentage discount cannot exceed 100" },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const existing = await Coupon.findOne({ code: body.code.toUpperCase().trim() });
    if (existing) {
      return NextResponse.json(
        { message: "Coupon code already exists" },
        { status: 409 }
      );
    }

    // Validate and convert expiryDate to valid Date object
    const expiryDate = new Date(body.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid expiry date" },
        { status: 400 }
      );
    }

    // Ensure isActive is a boolean
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    const coupon = await Coupon.create({
      code: body.code.toUpperCase().trim(),
      discountType: body.discountType,
      discountValue: body.discountValue,
      minOrderAmount: body.minOrderAmount || null,
      maxDiscount: body.maxDiscount || null,
      expiryDate: expiryDate,
      isActive: isActive
    });

    console.log(`[Admin Coupons] Coupon created: ${coupon.code} (ID: ${coupon._id})`);
    return NextResponse.json({ success: true, coupon });
  } catch (err) {
    console.error("[Admin Coupons] POST error:", err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return NextResponse.json(
        { message: "Coupon code already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { message: "Failed to create coupon" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return NextResponse.json(coupons);
  } catch (err) {
    console.error("[Admin Coupons] GET error:", err);
    return NextResponse.json(
      { message: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Coupon id required" },
        { status: 400 }
      );
    }

    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Coupons] DELETE error:", err);
    return NextResponse.json(
      { message: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await req.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json(
        { message: "id and isActive (boolean) are required" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!coupon) {
      return NextResponse.json(
        { message: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, coupon });
  } catch (err) {
    console.error("[Admin Coupons] PATCH error:", err);
    return NextResponse.json(
      { message: "Failed to update coupon" },
      { status: 500 }
    );
  }
}
