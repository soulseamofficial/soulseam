import { NextResponse } from "next/server";
import { sanitizeText } from "@/app/lib/delhivery";

export async function POST(req) {
  try {
    if (process.env.DELIVERY_PROVIDER === "mock") {
        return NextResponse.json({
          success: true,
          deliveryPartner: "Delhivery-Mock",
          awb: "MOCK" + Date.now(),
          trackingId: "MOCK" + Date.now(),
          pickupScheduled: true,
        });
      }
    const body = await req.json();

    const {
      orderId,
      shippingAddress,
      paymentMethod,
      items,
      orderValue,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID missing" },
        { status: 400 }
      );
    }

    // ----------------------------
    // DELHIVERY CONFIG
    // ----------------------------
    const BASE_URL = process.env.DELHIVERY_API_BASE_URL || "https://track.delhivery.com";
    const TOKEN = process.env.DELHIVERY_API_KEY || process.env.DELHIVERY_API_TOKEN;

    // ----------------------------
    // PAYLOAD (Delhivery format)
    // ----------------------------
    // CRITICAL: pickup_location MUST be a STRING, not an object
    // Address key MUST be "add", not "address"
    // COD requires cod_amount > 0
    const pickupLocationName = process.env.DELHIVERY_PICKUP_NAME?.trim();
    if (!pickupLocationName) {
      return NextResponse.json(
        { success: false, message: "DELHIVERY_PICKUP_NAME not configured" },
        { status: 500 }
      );
    }
    
    const isCOD = paymentMethod === "cod" || paymentMethod === "COD";
    const codAmount = isCOD ? Number(orderValue) : undefined;
    
    // Validate COD amount
    if (isCOD && (!codAmount || codAmount <= 0)) {
      return NextResponse.json(
        { success: false, message: "COD orders require cod_amount > 0" },
        { status: 400 }
      );
    }
    
    // CRITICAL: products_desc MUST be a STRING (comma-separated), not an array
    // Delhivery's Python backend expects products_desc as a string
    // Sending as array/object causes: "'unicode' object has no attribute 'get'" error
    const totalQuantity = items.reduce((s, i) => s + (i.quantity || 1), 0);
    const productsDesc = Array.isArray(items) && items.length > 0
      ? items
          .map(item => {
            // Sanitize product name to remove unicode characters
            const rawItemName = String(item.name || item.title || item.productName || "Item").substring(0, 100);
            const itemName = sanitizeText(rawItemName);
            const itemQuantity = Number(item.quantity || 1);
            return `${itemName} x${itemQuantity}`;
          })
          .join(", ")
      : `Item x${totalQuantity || 1}`;

    // Sanitize customer name
    const customerName = (shippingAddress.firstName || "") + " " + (shippingAddress.lastName || "").trim() || "Customer";

    const shipment = {
      order: String(orderId),
      payment_mode: isCOD ? "COD" : "Prepaid",
      name: sanitizeText(customerName), // Sanitize customer name
      weight: 0.5, // MUST be number (kg)
      phone: String(shippingAddress.phone || ""),
      add: sanitizeText(String(shippingAddress.address || shippingAddress.addressLine1 || "")), // Sanitize address
      pin: String(shippingAddress.pin || shippingAddress.pincode || ""),
      city: sanitizeText(String(shippingAddress.city || "")), // Sanitize city
      state: sanitizeText(String(shippingAddress.state || "")), // Sanitize state
      country: "India",
      // CRITICAL: products_desc MUST be a STRING (comma-separated), not an array
      // Delhivery's Python backend expects products_desc as a string
      products_desc: sanitizeText(productsDesc), // Sanitize products_desc
      quantity: totalQuantity, // MUST be number
      shipment_length: 20, // MUST be number (cm)
      shipment_breadth: 15, // MUST be number (cm)
      shipment_height: 10, // MUST be number (cm)
    };
    
    // Add cod_amount only for COD orders
    if (isCOD && codAmount > 0) {
      shipment.cod_amount = codAmount; // MUST be number > 0
    }
    
    // Sanitize shipment: Remove null/undefined fields and "N/A" values to prevent parsing errors
    // CRITICAL: products_desc MUST be included (already set to "Item" above)
    // CRITICAL: cod_amount must be REMOVED for Prepaid orders (only present for COD)
    const sanitizedShipment = {};
    for (const [key, value] of Object.entries(shipment)) {
      // Skip null, undefined, and "N/A" values
      // For Prepaid orders, explicitly remove cod_amount if it exists
      if (value !== null && value !== undefined && value !== "N/A") {
        // Remove cod_amount for Prepaid orders
        if (key === "cod_amount" && !isCOD) {
          continue; // Skip cod_amount for Prepaid orders
        }
        sanitizedShipment[key] = value;
      }
    }
    
    // CRITICAL: Ensure products_desc is always present and is a string (mandatory for Delhivery CMU)
    if (!sanitizedShipment.products_desc || typeof sanitizedShipment.products_desc !== 'string') {
      sanitizedShipment.products_desc = sanitizeText(`Item x${sanitizedShipment.quantity || 1}`);
    }
    
    // Validate products_desc is a string
    if (typeof sanitizedShipment.products_desc !== 'string' || sanitizedShipment.products_desc.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "products_desc must be a non-empty string" },
        { status: 400 }
      );
    }
    
    // Validate payload before sending - ensure products_desc is a string
    console.log(typeof sanitizedShipment.products_desc);
    
    // CRITICAL: pickup_location must be a plain STRING, not an object or escaped string
    // Remove any escaped quotes
    let pickupLocationClean = pickupLocationName;
    if (typeof pickupLocationClean === "string") {
      pickupLocationClean = pickupLocationClean.replace(/^["']|["']$/g, "").trim();
    }

    const payload = {
      // Optional: Add client name if configured (from ENV)
      ...(process.env.DELHIVERY_CLIENT ? { client: process.env.DELHIVERY_CLIENT } : {}),
      // CRITICAL: pickup_location must be STRING, not object, no escaped quotes
      pickup_location: pickupLocationClean,
      shipments: [sanitizedShipment],
    };

    // ----------------------------
    // DELHIVERY API CALL
    // ----------------------------
    // CRITICAL: Delhivery CMU API is a legacy form API and requires:
    // Content-Type: application/x-www-form-urlencoded
    // Body: format=json&data=<STRINGIFIED_JSON>
    const apiUrl = `${BASE_URL}/api/cmu/create.json`;
    
    // STRONG LOGGING: Before request
    const maskApiKey = (key) => {
      if (!key || typeof key !== "string" || key.length <= 6) return "******";
      return key.substring(0, 6) + "*".repeat(Math.min(key.length - 6, 10));
    };
    
    // Prepare form-encoded body
    const formData = new URLSearchParams();
    formData.append("format", "json");
    formData.append("data", JSON.stringify(payload));
    
    console.log("📤 Delhivery API Request - BEFORE:", {
      orderId: orderId,
      apiUrl,
      headers: {
        "Authorization": `Token ${maskApiKey(TOKEN)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      payload: {
        pickup_location: payload.pickup_location,
        client: payload.client || "N/A (not configured)",
        shipment_count: payload.shipments.length,
        order_id: sanitizedShipment.order,
        payment_mode: sanitizedShipment.payment_mode,
      },
      note: "Sending form-encoded body (format=json&data=<STRINGIFIED_JSON>)",
    });
    
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Token ${TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(), // Form-encoded body: format=json&data=<STRINGIFIED_JSON>
    });
    
    // Log headers once to confirm content-type is correct
    console.log("✅ Request headers confirmed:", {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Token ${maskApiKey(TOKEN)}`,
    });

    const data = await res.json();
    
    // STRONG LOGGING: After response
    console.log("📥 Delhivery API Response - AFTER:", {
      orderId: orderId,
      status: res.status,
      statusText: res.statusText,
      success: data?.success,
      awb: data?.packages?.[0]?.waybill || data?.upload_wbn || "N/A",
      fullResponse: data,
    });
    
    // CRITICAL: Treat as SUCCESS if:
    // 1. success === true AND waybill exists
    // 2. upload_wbn exists (package created even if success=false)
    // 3. package_count > 0 (packages created even if success=false)
    const packages = data?.packages || data?.package || [];
    const uploadWbn = data?.upload_wbn;
    const packageCount = data?.package_count || packages?.length || 0;
    const hasWaybill = packages?.[0]?.waybill;
    
    const isSuccess = 
      (data?.success === true && hasWaybill) ||
      (uploadWbn && uploadWbn.trim().length > 0) ||
      (packageCount > 0 && hasWaybill);
    
    if (!isSuccess) {
      const errorMessage = data?.error || data?.message || data?.rmk || "Delhivery order creation failed";
      console.error("❌ Delhivery order creation failed:", {
        success: data?.success,
        error: errorMessage,
        upload_wbn: uploadWbn || "N/A",
        package_count: packageCount,
        fullResponse: data,
      });
      
      // Throw structured error for Delhivery failures
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          provider: "delhivery",
          stage: "shipment_creation",
          orderId: orderId,
          details: data 
        },
        { status: 500 }
      );
    }
    
    // Extract waybill (prefer packages[0].waybill, fallback to upload_wbn)
    const waybill = hasWaybill ? String(packages[0].waybill).trim() : (uploadWbn ? String(uploadWbn).trim() : null);
    
    if (!waybill) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No waybill found in response",
          provider: "delhivery",
          stage: "shipment_creation",
          orderId: orderId,
        },
        { status: 500 }
      );
    }

    // STRONG LOGGING: Log AWB if generated
    console.log("✅ Delhivery shipment created successfully:", {
      orderId: orderId,
      awb: waybill,
      success: true,
      provider: "delhivery",
    });

    return NextResponse.json({
      success: true,
      awb: waybill,
      provider: "delhivery",
      deliveryPartner: "Delhivery",
      trackingId: waybill,
      pickupScheduled: true,
    });

  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}