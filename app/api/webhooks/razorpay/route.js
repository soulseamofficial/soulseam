import crypto from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { markOrderAsPaid } from "@/app/lib/razorpay";
import Order from "@/app/models/Order";
import { sendOrderToDelhivery } from "@/app/lib/delhivery";

export async function POST(req) {
  try {

    // ✅ GET RAW BODY
    const rawBody = await req.text();

    const signature = req.headers.get("x-razorpay-signature");

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("Missing webhook secret");
      return new NextResponse("Webhook secret missing", { status: 500 });
    }

    // ✅ VERIFY SIGNATURE
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid webhook signature");
      return new NextResponse("Invalid signature", { status: 400 });
    }

    // ✅ NOW parse JSON safely
    const event = JSON.parse(rawBody);

    // Log only event type, never full payload
    console.log("Webhook received:", event.event);

    //---------------------------------------
    // HANDLE PAYMENT CAPTURED
    //---------------------------------------

    if (event.event === "payment.captured") {
      // ✅ STEP 2: EXTRACT PAYMENT DATA FROM PAYLOAD
      const payment = event.payload.payment.entity;

      const razorpay_order_id = payment.order_id;
      const razorpay_payment_id = payment.id;
      
      // Extract payment amount for validation (if available)
      const paymentAmountInPaise = payment.amount || null;
      const paymentAmount = paymentAmountInPaise ? paymentAmountInPaise / 100 : null;

      // ✅ STEP 2: EXTRACT SIGNATURE FROM HEADER
      // Note: This is the webhook verification signature, not the payment signature
      // Payment signatures are only available from frontend verify calls
      const signatureFromHeader = signature; // Already extracted from x-razorpay-signature header

      // Connect to database
      await connectDB();

      // ✅ STEP 2: CALL IDEMPOTENT HELPER WITH FULL PAYMENT DATA
      // Webhook is the SINGLE SOURCE OF TRUTH for payment persistence
      const result = await markOrderAsPaid(
        razorpay_order_id,
        razorpay_payment_id,
        signatureFromHeader, // Pass webhook signature for audit trail
        {
          isWebhook: true,
          paymentAmount,
          paymentAmountInPaise,
        }
      );

      // Handle result
      if (!result.success) {
        if (result.error === "ORDER_NOT_FOUND") {
          // CRITICAL: Never create new order during payment update
          // Log error and return success to prevent webhook retries
          console.error("Webhook: Order not found", {
            orderNumber: null,
            razorpayPaymentId: razorpay_payment_id,
          });
          // Return 200 to prevent Razorpay from retrying
          return new NextResponse("Order not found (logged)", { status: 200 });
        }

        // For other errors, log and return success (webhook retries must NOT crash)
        console.error("Webhook: Payment update failed", {
          orderNumber: result.order?.orderNumber || null,
          razorpayPaymentId: razorpay_payment_id,
          error: result.error,
        });
        // Return 200 to prevent webhook retries
        return new NextResponse("Payment update failed (logged)", { status: 200 });
      }

      // Success - log only orderNumber and paymentId
      if (result.alreadyProcessed) {
        console.log("Webhook: Payment already processed (idempotent)", {
          orderNumber: result.order?.orderNumber || null,
          razorpayPaymentId: razorpay_payment_id,
        });
        // SKIP shipment creation - prevents double courier booking
      } else {
        console.log("Webhook: Payment processed successfully", {
          orderNumber: result.order?.orderNumber || null,
          razorpayPaymentId: razorpay_payment_id,
        });

        // STEP 6: Create shipment ONLY if payment was just processed (not already processed)
        // This prevents double shipment creation on webhook retries
        if (result.order && !result.alreadyProcessed) {
          try {
            const order = await Order.findById(result.order._id);
            if (order && !order.isShipmentCreated && order.orderStatus === "CONFIRMED") {
              const shippingAddress = order.shippingAddress;
              const fullName = shippingAddress?.fullName || "";
              const [firstName, ...rest] = fullName.split(" ").filter(Boolean);
              const lastName = rest.join(" ");

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

              // Update order with shipment details if successful
              if (delhiveryResponse?.success) {
                const updateData = {
                  isShipmentCreated: true,
                  courierResponse: delhiveryResponse,
                  delhiveryWaybill: delhiveryResponse.waybill,
                  delhiveryCourierName: delhiveryResponse.courier_name,
                  delhiveryDeliveryStatus: delhiveryResponse.delivery_status,
                  delhiveryTrackingUrl: delhiveryResponse.tracking_url,
                  delhiverySent: true,
                  delivery_provider: "DELHIVERY",
                  delivery_status: delhiveryResponse.delivery_status || "SENT",
                  delhiveryAWB: delhiveryResponse.waybill,
                  delhiveryTrackingId: delhiveryResponse.waybill,
                  delhiveryPartner: delhiveryResponse.courier_name,
                };
                await Order.findByIdAndUpdate(order._id, { $set: updateData });
                console.log("Webhook: Shipment created", {
                  orderNumber: order.orderNumber,
                  waybill: delhiveryResponse.waybill,
                });
              }
            }
          } catch (shipmentError) {
            // Log error but don't fail webhook - shipment can be created manually later
            console.error("Webhook: Shipment creation failed (non-critical)", {
              orderNumber: result.order?.orderNumber || null,
              error: shipmentError.message,
            });
          }
        }
      }
    }

    return new NextResponse("Webhook processed", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    // Return 200 to prevent webhook retries from crashing
    return new NextResponse("Webhook failed (logged)", { status: 200 });
  }
}
