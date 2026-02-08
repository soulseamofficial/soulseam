import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import Order from "@/app/models/Order";
import User from "@/app/models/User";

/**
 * POST /api/admin/orders/create
 * Creates an order by admin (admin-only)
 * 
 * Requirements:
 * - Must find user by email or phone
 * - Order MUST include userId, email, customerName, phone
 * - Sets orderSource: "ADMIN"
 */
export async function POST(req) {
  try {
    // Verify admin authentication
    const { authorized, error } = await requireAdminAuth(req);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();
    const {
      customerEmail,
      customerPhone,
      items,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      orderStatus,
      subtotal,
      discount,
      totalAmount,
      coupon,
      advancePaid,
      remainingCOD,
      orderMessage,
    } = body;

    // Validate required fields
    if (!customerEmail && !customerPhone) {
      return NextResponse.json(
        { success: false, error: "Customer email or phone is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Items are required" },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { success: false, error: "Shipping address is required" },
        { status: 400 }
      );
    }

    // STEP 1: Find user before creating order
    const user = await User.findOne({
      $or: [
        { email: customerEmail },
        { phone: customerPhone }
      ]
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: "User not found. Please register the user first." 
        },
        { status: 404 }
      );
    }

    // STEP 2: Create order with userId linked
    const order = await Order.create({
      userId: user._id,
      items,
      shippingAddress,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentStatus || "PENDING",
      orderStatus: orderStatus || "CREATED",
      coupon: coupon || null,
      subtotal: subtotal || 0,
      discount: discount || 0,
      discountAmount: discount || 0,
      shipping: 0,
      totalAmount: totalAmount || 0,
      finalTotal: totalAmount || 0,
      advancePaid: advancePaid || 0,
      remainingCOD: remainingCOD || 0,
      orderMessage: orderMessage || null,
      orderSource: "ADMIN",
      
      // Legacy fields for backward compatibility
      // These fields ensure email, customerName (firstName + lastName), and phone are stored
      customer: {
        email: user.email || customerEmail || "",
        firstName: shippingAddress.fullName?.split(" ")[0] || user.name?.split(" ")[0] || "",
        lastName: shippingAddress.fullName?.split(" ").slice(1).join(" ") || user.name?.split(" ").slice(1).join(" ") || "",
        phone: user.phone || customerPhone || shippingAddress.phone || "",
      },
      shippingAddressLegacy: {
        address: shippingAddress.addressLine1 || "",
        apt: shippingAddress.addressLine2 || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        pin: shippingAddress.pincode || "",
        country: shippingAddress.country || "India",
      },
      payment: {
        method: paymentMethod === "COD" ? "COD" : "Razorpay",
        status: paymentStatus === "PAID" ? "paid" : "pending",
      },
      legacyOrderStatus: orderStatus === "CONFIRMED" ? "paid" : "created",
    });

    return NextResponse.json(
      { 
        success: true, 
        orderId: order._id,
        order: order,
        message: "Order created successfully and linked to user"
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Admin Create Order] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to create order" 
      },
      { status: 500 }
    );
  }
}
