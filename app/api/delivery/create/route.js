import { NextResponse } from "next/server";

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
    
    // CRITICAL: products_desc MUST be an ARRAY of objects, not a string
    // Delhivery's Python backend expects products_desc as array and calls .get() on each product object
    // Sending as string causes: "'unicode' object has no attribute 'get'" error
    // Each product object must have: name, quantity, and value fields
    const totalQuantity = items.reduce((s, i) => s + (i.quantity || 1), 0);
    const productsDesc = Array.isArray(items) && items.length > 0
      ? items.map(item => ({
          name: String(item.name || item.title || item.productName || "Item").substring(0, 100), // Max 100 chars
          quantity: Number(item.quantity || 1),
          value: Number(item.price || item.amount || item.value || 0)
        }))
      : [{
          name: "Item",
          quantity: totalQuantity || 1,
          value: isCOD ? codAmount : 0
        }];

    const shipment = {
      order: String(orderId),
      payment_mode: isCOD ? "COD" : "Prepaid",
      name: (shippingAddress.firstName || "") + " " + (shippingAddress.lastName || "").trim() || "Customer",
      weight: 0.5, // MUST be number (kg)
      phone: String(shippingAddress.phone || ""),
      add: String(shippingAddress.address || shippingAddress.addressLine1 || ""), // MUST be "add", not "address"
      pin: String(shippingAddress.pin || shippingAddress.pincode || ""),
      city: String(shippingAddress.city || ""),
      state: String(shippingAddress.state || ""),
      country: "India",
      // CRITICAL: products_desc MUST be an ARRAY of product objects (not a string)
      // Delhivery's Python backend calls .get() on each product object in the array
      products_desc: productsDesc, // MUST be array of objects with name, quantity, value
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
    
    // CRITICAL: Ensure products_desc is always present and is an array (mandatory for Delhivery CMU)
    if (!sanitizedShipment.products_desc || !Array.isArray(sanitizedShipment.products_desc)) {
      sanitizedShipment.products_desc = [{
        name: "Item",
        quantity: sanitizedShipment.quantity || 1,
        value: isCOD ? codAmount : 0
      }];
    }
    
    // Validate products_desc array structure
    if (!Array.isArray(sanitizedShipment.products_desc) || sanitizedShipment.products_desc.length === 0) {
      return NextResponse.json(
        { success: false, message: "products_desc must be a non-empty array of product objects" },
        { status: 400 }
      );
    }
    
    // Ensure each product object has required fields
    for (let i = 0; i < sanitizedShipment.products_desc.length; i++) {
      const product = sanitizedShipment.products_desc[i];
      if (!product || typeof product !== 'object') {
        return NextResponse.json(
          { success: false, message: `products_desc[${i}] must be an object with name, quantity, and value fields` },
          { status: 400 }
        );
      }
      if (!product.name || typeof product.name !== 'string') {
        sanitizedShipment.products_desc[i].name = "Item";
      }
      if (typeof product.quantity !== 'number' || isNaN(product.quantity)) {
        sanitizedShipment.products_desc[i].quantity = 1;
      }
      if (typeof product.value !== 'number' || isNaN(product.value)) {
        sanitizedShipment.products_desc[i].value = 0;
      }
    }
    
    const payload = {
      // Optional: Add client name if configured
      ...(process.env.DELHIVERY_CLIENT_NAME ? { client: process.env.DELHIVERY_CLIENT_NAME } : {}),
      // CRITICAL: pickup_location must be STRING, not object
      pickup_location: pickupLocationName,
      shipments: [sanitizedShipment],
    };

    // ----------------------------
    // DELHIVERY API CALL
    // ----------------------------
    // CRITICAL: Delhivery CMU API requires application/x-www-form-urlencoded
    // with BOTH 'data' AND 'format' keys
    const apiUrl = `${BASE_URL}/api/cmu/create.json`;
    const formData = new URLSearchParams();
    formData.append("format", "json"); // STRING "json", not JSON
    formData.append("data", JSON.stringify(payload)); // JSON stringified payload
    
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Token ${TOKEN}`,
      },
      body: formData.toString(),
    });

    const data = await res.json();
    
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
      return NextResponse.json(
        { success: false, message: errorMessage, details: data },
        { status: 500 }
      );
    }
    
    // Extract waybill (prefer packages[0].waybill, fallback to upload_wbn)
    const waybill = hasWaybill ? String(packages[0].waybill).trim() : (uploadWbn ? String(uploadWbn).trim() : null);
    
    if (!waybill) {
      return NextResponse.json(
        { success: false, message: "No waybill found in response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deliveryPartner: "Delhivery",
      awb: waybill,
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