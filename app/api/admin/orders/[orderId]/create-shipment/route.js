import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import Order from "@/app/models/Order";
import { sendOrderToDelhivery, logVerificationInstructions } from "@/app/lib/delhivery";

/**
 * POST /api/admin/orders/[orderId]/create-shipment
 * Creates a Delhivery shipment for an order (admin-only)
 * 
 * Requirements:
 * - Order status must be CONFIRMED
 * - Shipment must not already be created (isShipmentCreated = false)
 * - Stores AWB, courier response, and updates deliveryStatus
 * - Handles API failures safely without breaking order
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

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Validation: Order status must be CONFIRMED
    if (order.orderStatus !== "CONFIRMED") {
      return NextResponse.json(
        { 
          success: false, 
          error: `Shipment can only be created for CONFIRMED orders. Current status: ${order.orderStatus}` 
        },
        { status: 400 }
      );
    }

    // Validation: Block duplicate shipment creation
    if (order.isShipmentCreated === true) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Shipment already created for this order",
          existingShipment: {
            waybill: order.delhiveryWaybill,
            courierName: order.delhiveryCourierName,
            createdAt: order.updatedAt,
          }
        },
        { status: 400 }
      );
    }

    // Prepare order data for Delhivery
    const shippingAddress = order.shippingAddress;
    const fullName = shippingAddress?.fullName || "";
    const [firstName, ...rest] = fullName.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    try {
      // Call Delhivery API to create shipment
      const delhiveryResponse = await sendOrderToDelhivery({
        orderId: order._id.toString(),
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
        paymentMethod: order.paymentMethod,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: order.totalAmount,
      });

      // Prepare update data
      const updateData = {
        isShipmentCreated: true, // Mark shipment as created
        courierResponse: delhiveryResponse, // Store full courier response
      };

      if (delhiveryResponse?.success) {
        // Success: Store Delhivery tracking details
        updateData.delhiveryWaybill = delhiveryResponse.waybill;
        updateData.delhiveryCourierName = delhiveryResponse.courier_name;
        updateData.delhiveryDeliveryStatus = delhiveryResponse.delivery_status;
        updateData.delhiveryTrackingUrl = delhiveryResponse.tracking_url;
        updateData.delhiverySent = true;
        updateData.delhiveryError = null;
        
        // Standardized delivery fields
        updateData.delivery_provider = "DELHIVERY";
        updateData.delivery_status = delhiveryResponse.delivery_status || "SENT";
        
        // Legacy fields for backward compatibility
        updateData.delhiveryAWB = delhiveryResponse.waybill;
        updateData.delhiveryTrackingId = delhiveryResponse.waybill;
        updateData.delhiveryPartner = delhiveryResponse.courier_name;
        
        // Log verification instructions if real waybill (not mock)
        if (!delhiveryResponse.isMock && delhiveryResponse.waybill) {
          logVerificationInstructions(delhiveryResponse.waybill);
        }
        
        console.log("✅ Shipment created successfully:", {
          orderId: order._id,
          waybill: delhiveryResponse.waybill,
          isMock: delhiveryResponse.isMock || false,
        });

        // Update order with shipment details
        await Order.findByIdAndUpdate(orderId, { $set: updateData });

        return NextResponse.json({
          success: true,
          message: "Shipment created successfully",
          shipment: {
            waybill: delhiveryResponse.waybill,
            trackingUrl: delhiveryResponse.tracking_url,
            courierName: delhiveryResponse.courier_name,
            deliveryStatus: delhiveryResponse.delivery_status,
            isMock: delhiveryResponse.isMock || false,
          },
        });
      } else {
        // Failure: Store error but don't fail the request (order remains valid)
        // Extract error message with priority: rmk > message > error > fallback
        const errorMessage = 
          delhiveryResponse?.rawResponse?.rmk ||
          delhiveryResponse?.rawResponse?.message ||
          delhiveryResponse?.error ||
          "Shipment creation failed";
        
        updateData.delhiverySent = false;
        updateData.delhiveryError = errorMessage; // Store message string, not boolean
        updateData.delhiveryDeliveryStatus = "PENDING";
        updateData.delivery_provider = "DELHIVERY";
        updateData.delivery_status = "PENDING";
        
        // Still mark as attempted (but failed) to prevent repeated attempts
        // Admin can retry manually if needed
        updateData.isShipmentCreated = false; // Allow retry on failure
        
        // Update order with error details
        await Order.findByIdAndUpdate(orderId, { $set: updateData });

        console.error("❌ Failed to create shipment (order still valid):", {
          orderId: order._id,
          error: errorMessage,
          delhiveryResponse: delhiveryResponse?.rawResponse || delhiveryResponse,
        });

        return NextResponse.json(
          {
            success: false,
            error: errorMessage, // Return message string, not boolean
            details: delhiveryResponse?.rawResponse || delhiveryResponse,
          },
          { status: 500 }
        );
      }
    } catch (delhiveryError) {
      // Handle API failures safely - don't break the order
      console.error("❌ Shipment creation error:", delhiveryError);
      
      // Extract error message - handle both Error objects and response objects
      const errorMessage = 
        delhiveryError?.rawResponse?.rmk ||
        delhiveryError?.rawResponse?.message ||
        delhiveryError?.error ||
        delhiveryError?.message ||
        "Shipment creation failed";
      
      // Store error but allow retry (don't mark as created)
      const updateData = {
        delhiverySent: false,
        delhiveryError: errorMessage, // Store message string, not boolean
        delhiveryDeliveryStatus: "PENDING",
        delivery_provider: "DELHIVERY",
        delivery_status: "PENDING",
        isShipmentCreated: false, // Allow retry
        courierResponse: {
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
      };
      
      await Order.findByIdAndUpdate(orderId, { $set: updateData });

      return NextResponse.json(
        {
          success: false,
          error: errorMessage, // Return message string, not boolean
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Admin Create Shipment] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
