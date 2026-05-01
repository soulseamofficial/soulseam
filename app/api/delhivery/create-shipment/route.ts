import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { requireAdminAuth } from '@/app/lib/adminAuth';
import Order from '@/app/models/Order';
import { createShipment, buildShipmentPayload, checkPincode } from '@/app/lib/delhivery';

console.log('[Delhivery] Using file: delhivery.ts');

// Format key missing fix: ensure "format": "json" is top-level, data is stringified array
// Production ready: Vercel lo add env vars: DELHIVERY_BASE_URL=https://track.delhivery.com, DELHIVERY_TOKEN=..., DELHIVERY_WAREHOUSE_NAME=Soul seam 2
// Test: Local lo success ayithe Vercel lo redeploy + test low value order

/**
 * POST /api/delhivery/create-shipment
 * 
 * Creates a Delhivery shipment for an order automatically.
 * 
 * Request Body:
 * {
 *   "orderId": "order_id_string"
 * }
 * 
 * Response (Success):
 * {
 *   "success": true,
 *   "awb": "AWB123456789",
 *   "message": "Shipment created"
 * }
 * 
 * Response (Error):
 * {
 *   "success": false,
 *   "error": "Error message"
 * }
 * 
 * Testing:
 * - Use Postman: POST /api/delhivery/create-shipment
 *   Body: { "orderId": "your_order_id" }
 *   Headers: Include admin auth cookie/session
 * 
 * Common Errors:
 * - "Already created" → Order already has shipment_awb or delhiveryAWB
 * - "Warehouse mismatch" → DELHIVERY_WAREHOUSE_NAME doesn't match Delhivery dashboard
 * - "Low wallet balance" → Add funds to Delhivery account
 * - "Invalid pincode" → Pincode not serviceable by Delhivery
 * 
 * After Success:
 * - Check Delhivery One dashboard > Shipments > search by order_id
 * - AWB saved in: order.delhiveryAWB, order.delhiveryWaybill
 * - Order status updated to: "SHIPPED" or "MANIFESTED"
 */
export async function POST(req: Request) {
  let orderId: string | null = null;
  
  try {
    // Verify admin authentication
    const { authorized, error } = await requireAdminAuth(req);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    orderId = body.orderId;

    // Validate orderId
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'orderId is required and must be a string' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Fetch order from database
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // After fetching order: log warehouse name
    console.log('[Shipment Attempt] Using warehouse:', process.env.DELHIVERY_WAREHOUSE_NAME);

    // Check if shipment already created
    if (order.delhiveryAWB || order.delhiveryWaybill || order.isShipmentCreated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Already created',
          message: 'Shipment already exists for this order',
          awb: order.delhiveryAWB || order.delhiveryWaybill,
        },
        { status: 400 }
      );
    }

    // Validate order has required data
    if (!order.shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Order missing shipping address' },
        { status: 400 }
      );
    }

    if (!order.items || order.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order has no items' },
        { status: 400 }
      );
    }

    // Build full address string
    const addressParts = [
      order.shippingAddress.addressLine1,
      order.shippingAddress.addressLine2,
      order.shippingAddress.city,
      order.shippingAddress.state,
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    // Get customer name
    const customerName = 
      order.shippingAddress.fullName ||
      `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() ||
      'Customer';

    // Get phone
    const phone = 
      order.shippingAddress.phone ||
      order.customer?.phone ||
      '';

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Order missing customer phone number' },
        { status: 400 }
      );
    }

    // Get pincode
    const pincode = order.shippingAddress.pincode || '';
    if (!pincode) {
      return NextResponse.json(
        { success: false, error: 'Order missing pincode' },
        { status: 400 }
      );
    }

    // Before pincode check: console.log('[Production Check] BASE_URL:', process.env.DELHIVERY_BASE_URL);
    console.log('[Production Check] BASE_URL:', process.env.DELHIVERY_BASE_URL);

    // Check pincode serviceability before creating shipment
    const isServiceable = await checkPincode(pincode);
    
    console.log('[Create Shipment] Pincode check result:', isServiceable);
    
    if (!isServiceable) {
      // If isServiceable false: delhiveryError = `Pincode ${pincode} not serviceable - ${error details}`
      const errorDetails = 'Check console logs for full pincode API response';
      await Order.findByIdAndUpdate(orderId, { $set: { delhiveryError: `Pincode ${pincode} not serviceable - ${errorDetails}` } });
      return NextResponse.json({ 
        success: false, 
        error: `Pincode ${pincode} not serviceable - ${errorDetails}` 
      }, { status: 400 });
    }
    
    console.log('[Shipment] Pincode serviceable, sending to production');

    // Get payment mode (convert to Delhivery format)
    const paymentMode = order.paymentMethod === 'COD' ? 'COD' : 'PREPAID';

    // Build shipment payload
    const shipmentPayload = buildShipmentPayload({
      orderId: order._id.toString(),
      customerName,
      phone,
      address: fullAddress,
      pincode,
      payment_mode: paymentMode,
      total: order.totalAmount || order.finalTotal || 0,
      order_items: order.items.map((item: any) => ({
        name: item.name || 'Product',
        qty: item.quantity || 1,
        price: item.price || 0,
      })),
    });

    // Before createShipment: log full payload
    console.log('[Shipment Payload]:', JSON.stringify(shipmentPayload, null, 2));

    // Before calling createShipment: log token presence and BASE_URL
    console.log('[Shipment Route] DELHIVERY_TOKEN in env:', process.env.DELHIVERY_TOKEN ? 'present' : 'MISSING');
    console.log('[Shipment] Using BASE_URL:', process.env.DELHIVERY_BASE_URL);
    // Log auth type: Production (track.delhivery.com) requires Authorization: Token header, Staging works with ?token=
    console.log('[Shipment] Auth type:', process.env.DELHIVERY_BASE_URL?.includes('track') ? 'Header Token' : 'Query param');

    // Call Delhivery API to create shipment
    console.log('[Create Shipment] Calling Delhivery API for order:', orderId);
    const delhiveryResponse = await createShipment(shipmentPayload);

    // Check if shipment was created successfully
    if (
      delhiveryResponse.packages &&
      delhiveryResponse.packages.length > 0 &&
      (delhiveryResponse.packages[0].waybill || delhiveryResponse.packages[0].AWB)
    ) {
      // Extract waybill from response
      // Delhivery response typically has 'waybill' field, but may also have 'AWB' as fallback
      // Prefer 'waybill' first as it's the standard field in Delhivery responses
      const waybill = 
        delhiveryResponse.packages[0].waybill ||  // Primary field - prefer this
        delhiveryResponse.packages[0].AWB ||     // Fallback field - use if waybill not present
        '';

      if (!waybill) {
        throw new Error('AWB not found in Delhivery response');
      }

      console.log('[Success] Waybill extracted:', waybill);

      // Update order in database
      const updateData: any = {
        delhiveryAWB: waybill,
        delhiveryWaybill: waybill,
        isShipmentCreated: true,
        delivery_provider: 'DELHIVERY',
        delivery_status: 'CREATED',
        delhiverySent: true,
        delhiveryError: null,
        courierResponse: delhiveryResponse,
      };

      // Update order status to SHIPPED if it's CONFIRMED
      if (order.orderStatus === 'CONFIRMED') {
        updateData.orderStatus = 'SHIPPED';
      }

      // Add shipment created timestamp
      updateData.shipment_created_at = new Date();

      await Order.findByIdAndUpdate(orderId, { $set: updateData });

      console.log('[Create Shipment] Success:', {
        orderId,
        waybill,
      });

      // In success: log full courierResponse
      console.log('[Shipment Success] Full courierResponse:', JSON.stringify(delhiveryResponse, null, 2));

      return NextResponse.json({
        success: true,
        awb: waybill,
        message: 'Shipment created',
        shipment: {
          waybill,
          awb: waybill,
        },
      });
    } else {
      // Extract error message from response
      const errorMessage = 
        delhiveryResponse.packages?.[0]?.error ||
        delhiveryResponse.packages?.[0]?.rmk ||
        delhiveryResponse.rmk ||
        delhiveryResponse.error ||
        delhiveryResponse.message ||
        'Failed to create shipment in Delhivery';

      // Store error in order for admin visibility
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          delhiveryError: errorMessage,
          delhiverySent: false,
          isShipmentCreated: false,
        },
      });

      console.error('[Create Shipment] Failed:', {
        orderId,
        error: errorMessage,
        response: delhiveryResponse,
      });
      
      // On error: log full delhiveryResponse even if packages empty
      console.error('[Create Shipment] Full delhiveryResponse:', JSON.stringify(delhiveryResponse, null, 2));

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: delhiveryResponse,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Create Shipment] Error:', error);

    // Try to update error in order if we have orderId
    if (orderId) {
      try {
        await connectDB();
        await Order.findByIdAndUpdate(orderId, {
          $set: {
            delhiveryError: error instanceof Error ? error.message : 'Unknown error',
            delhiverySent: false,
            isShipmentCreated: false,
          },
        });
      } catch (updateError) {
        console.error('[Create Shipment] Failed to update error in DB:', updateError);
      }
    }

    const errorMessage = 
      error instanceof Error ? error.message : 'Failed to create shipment';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
