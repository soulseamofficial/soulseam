import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import Order from "@/app/models/Order";
import { sendOrderToDelhivery, logVerificationInstructions } from "@/app/lib/delhivery";

/**
 * POST /api/admin/orders/[orderId]/create-shipment
 * Creates a Delhivery shipment for an order (admin-only)
 * 
 * CRITICAL SAFETY FEATURES:
 * - Hard safety checks: Order exists, payment status is PAID
 * - Atomic locking: Prevents double clicks and race conditions
 * - Lock release on failure: Prevents permanent blocking
 * - Manual-only: Shipment NEVER auto-created after payment
 */
export async function POST(req, { params }) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Verify admin authentication
    const { authorized, error } = await requireAdminAuth(req);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // STEP 3: HARD SAFETY CHECKS
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.paymentStatus !== "PAID") {
      return NextResponse.json(
        { success: false, error: "Cannot ship unpaid order" },
        { status: 400 }
      );
    }

    if (order.isShipmentCreated) {
      return NextResponse.json(
        { success: false, message: "Shipment already created" },
        { status: 200 }
      );
    }

    // STEP 4: ATOMIC LOCK (CRITICAL - Prevents double clicks from admin)
    const lockedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        isShipmentCreated: false
      },
      {
        isShipmentCreated: true
      },
      { new: true }
    );

    if (!lockedOrder) {
      return NextResponse.json(
        { success: false, message: "Shipment already processed" },
        { status: 200 }
      );
    }

    // Prepare order data for Delhivery
    const shippingAddress = lockedOrder.shippingAddress;
    const fullName = shippingAddress?.fullName || "";
    const [firstName, ...rest] = fullName.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    try {
      // STEP 5: CALL DELHIVERY
      const delhiveryResponse = await sendOrderToDelhivery({
        orderId: lockedOrder._id.toString(),
        shippingAddress: {
          fullName: shippingAddress?.fullName || "",
          firstName: firstName || "",
          lastName: lastName || "",
          phone: shippingAddress?.phone || "",
          addressLine1: shippingAddress?.addressLine1 || "",
          addressLine2: shippingAddress?.addressLine2 || "",
          city: shippingAddress?.city || "",
          state: shippingAddress?.state || "",
          pincode: shippingAddress?.pincode || "",
          country: shippingAddress?.country || "India",
        },
        paymentMethod: lockedOrder.paymentMethod,
        items: lockedOrder.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: lockedOrder.totalAmount,
      });

      if (delhiveryResponse?.success) {
        // STEP 7: SAVE AWB (Success path)
        const updateData = {
          delhiveryAWB: delhiveryResponse.waybill,
          delivery_status: "CREATED",
          courierResponse: delhiveryResponse,
          delhiveryWaybill: delhiveryResponse.waybill,
          delhiveryCourierName: delhiveryResponse.courier_name,
          delhiveryDeliveryStatus: delhiveryResponse.delivery_status,
          delhiveryTrackingUrl: delhiveryResponse.tracking_url,
          delhiverySent: true,
          delhiveryError: null,
          delivery_provider: "DELHIVERY",
          delhiveryTrackingId: delhiveryResponse.waybill,
          delhiveryPartner: delhiveryResponse.courier_name,
        };

        // Log verification instructions if real waybill (not mock)
        if (!delhiveryResponse.isMock && delhiveryResponse.waybill) {
          logVerificationInstructions(delhiveryResponse.waybill);
        }

        await Order.updateOne(
          { _id: orderId },
          { $set: updateData }
        );

        console.log("✅ Shipment created successfully:", {
          orderId: lockedOrder._id,
          waybill: delhiveryResponse.waybill,
          isMock: delhiveryResponse.isMock || false,
        });

        return NextResponse.json({
          success: true,
          message: "Shipment created successfully",
          shipment: {
            waybill: delhiveryResponse.waybill,
            awb: delhiveryResponse.waybill,
            trackingUrl: delhiveryResponse.tracking_url,
            courierName: delhiveryResponse.courier_name,
            deliveryStatus: delhiveryResponse.delivery_status,
            isMock: delhiveryResponse.isMock || false,
          },
        });
      } else {
        // STEP 6: IF API FAILS → RELEASE LOCK (VERY IMPORTANT)
        await Order.updateOne(
          { _id: orderId },
          { isShipmentCreated: false }
        );

        // Extract error message
        const errorMessage = 
          delhiveryResponse?.rawResponse?.rmk ||
          delhiveryResponse?.rawResponse?.message ||
          delhiveryResponse?.error ||
          "Shipment creation failed";

        // Store error for admin visibility
        await Order.updateOne(
          { _id: orderId },
          {
            $set: {
              delhiveryError: errorMessage,
              delhiverySent: false,
              delivery_status: "PENDING",
            }
          }
        );

        console.error("❌ Failed to create shipment (lock released):", {
          orderId: lockedOrder._id,
          error: errorMessage,
        });

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            details: delhiveryResponse?.rawResponse || delhiveryResponse,
          },
          { status: 500 }
        );
      }
    } catch (delhiveryError) {
      // STEP 6: IF API FAILS → RELEASE LOCK (VERY IMPORTANT)
      await Order.updateOne(
        { _id: orderId },
        { isShipmentCreated: false }
      );

      // Extract error message
      const errorMessage = 
        delhiveryError?.rawResponse?.rmk ||
        delhiveryError?.rawResponse?.message ||
        delhiveryError?.error ||
        delhiveryError?.message ||
        "Shipment creation failed";

      // Store error for admin visibility
      await Order.updateOne(
        { _id: orderId },
        {
          $set: {
            delhiveryError: errorMessage,
            delhiverySent: false,
            delivery_status: "PENDING",
          }
        }
      );

      console.error("❌ Shipment creation error (lock released):", {
        orderId: lockedOrder._id,
        error: errorMessage,
      });

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Admin Create Shipment] Error:", error);
    
    // CRITICAL: Release lock if we somehow got here with a locked order
    try {
      const { orderId } = await params;
      if (orderId) {
        await connectDB();
        await Order.updateOne(
          { _id: orderId },
          { isShipmentCreated: false }
        );
      }
    } catch (unlockError) {
      console.error("[Admin Create Shipment] Failed to release lock:", unlockError);
    }

    return NextResponse.json(
      { success: false, error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
