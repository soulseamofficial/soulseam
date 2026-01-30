/**
 * Delhivery API Integration Service
 * 
 * This service handles all interactions with Delhivery API for order creation and tracking.
 * API key is securely stored in environment variables and never exposed to frontend.
 * 
 * MOCK MODE: Only enabled when DELHIVERY_MOCK === "true" (explicitly set)
 * REAL MODE: Used when DELHIVERY_MOCK !== "true" AND DELHIVERY_API_KEY exists
 */

/**
 * Logs environment configuration safely (without exposing secrets)
 */
function logDelhiveryConfig() {
  const hasApiKey = !!process.env.DELHIVERY_API_KEY;
  const mockMode = process.env.DELHIVERY_MOCK === "true";
  const baseUrl = process.env.DELHIVERY_API_BASE_URL || "https://track.delhivery.com";
  const nodeEnv = process.env.NODE_ENV;
  
  console.log("🔧 Delhivery Configuration:", {
    mode: mockMode ? "MOCK" : "REAL",
    hasApiKey: hasApiKey,
    apiBaseUrl: baseUrl,
    nodeEnv: nodeEnv,
    mockFlag: process.env.DELHIVERY_MOCK || "not set",
  });
}

/**
 * Validates if a waybill number is real (numeric, not MOCK prefixed)
 * 
 * @param {string} waybill - Waybill number to validate
 * @returns {boolean} - True if waybill is real (numeric)
 */
function isValidWaybill(waybill) {
  if (!waybill || typeof waybill !== "string") return false;
  // Real waybills are numeric, not prefixed with "MOCK"
  return /^\d+$/.test(waybill.trim()) && !waybill.toUpperCase().startsWith("MOCK");
}

/**
 * Sends an order to Delhivery for fulfillment
 * 
 * @param {Object} orderData - Order data to send to Delhivery
 * @param {string} orderData.orderId - MongoDB order ID
 * @param {Object} orderData.shippingAddress - Shipping address object
 * @param {string} orderData.paymentMethod - "COD" or "ONLINE"
 * @param {Array} orderData.items - Array of order items
 * @param {number} orderData.totalAmount - Total order amount
 * @returns {Promise<Object>} - Delhivery response with success status
 */
export async function sendOrderToDelhivery(orderData) {
  try {
    // Log configuration on first call (helps debug)
    logDelhiveryConfig();

    // Get environment variables
    const API_KEY = process.env.DELHIVERY_API_KEY;
    const API_BASE_URL = process.env.DELHIVERY_API_BASE_URL || "https://track.delhivery.com";
    const MOCK_MODE = process.env.DELHIVERY_MOCK === "true";

    // MOCK MODE: Only enabled when DELHIVERY_MOCK is explicitly "true"
    // REAL MODE: Used when DELHIVERY_MOCK !== "true" AND API_KEY exists
    if (MOCK_MODE) {
      console.log("🧪 Delhivery Mock Mode: Simulating order creation");
      const mockWaybill = `MOCK${Date.now()}`;
      return {
        success: true,
        waybill: mockWaybill,
        courier_name: "Delhivery-Mock",
        delivery_status: "In Transit",
        tracking_url: `https://www.delhivery.com/track/${mockWaybill}`,
        deliveryStatus: "SENT",
        isMock: true,
      };
    }

    // REAL MODE: Check if API key exists
    if (!API_KEY) {
      console.warn("⚠️ Delhivery API key not configured. Skipping Delhivery order creation.");
      return {
        success: false,
        error: "DELHIVERY_API_KEY not configured",
        deliveryStatus: "NOT_SENT",
        isMock: false,
      };
    }

    // Validate required order data
    if (!orderData.orderId || !orderData.shippingAddress || !orderData.items || !orderData.totalAmount) {
      console.error("❌ Invalid order data for Delhivery:", {
        hasOrderId: !!orderData.orderId,
        hasShippingAddress: !!orderData.shippingAddress,
        hasItems: !!orderData.items,
        hasTotalAmount: !!orderData.totalAmount,
      });
      return {
        success: false,
        error: "Invalid order data",
        deliveryStatus: "NOT_SENT",
        isMock: false,
      };
    }

    // Prepare pickup location from environment variables
    const pickupLocation = {
      name: process.env.DELHIVERY_PICKUP_NAME || "SOULSEAM",
      phone: process.env.DELHIVERY_PICKUP_PHONE || "",
      pin: process.env.DELHIVERY_PICKUP_PINCODE || "",
      address: process.env.DELHIVERY_PICKUP_ADDRESS || "",
      city: process.env.DELHIVERY_PICKUP_CITY || "",
      state: process.env.DELHIVERY_PICKUP_STATE || "",
    };

    // Validate pickup location
    if (!pickupLocation.pin || !pickupLocation.address || !pickupLocation.city || !pickupLocation.state) {
      console.error("❌ Delhivery pickup location not configured properly");
      return {
        success: false,
        error: "Pickup location not configured",
        deliveryStatus: "NOT_SENT",
        isMock: false,
      };
    }

    // Prepare shipment data
    const shippingAddress = orderData.shippingAddress;
    const fullName = shippingAddress.fullName || `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim();
    
    const shipment = {
      order: orderData.orderId.toString(), // Use MongoDB order ID as reference
      payment_mode: orderData.paymentMethod === "COD" ? "COD" : "Prepaid",
      total_amount: Number(orderData.totalAmount),
      name: fullName || "Customer",
      phone: shippingAddress.phone || "",
      add: shippingAddress.addressLine1 || shippingAddress.address || "",
      pin: shippingAddress.pincode || shippingAddress.pin || "",
      city: shippingAddress.city || "",
      state: shippingAddress.state || "",
      country: shippingAddress.country || "India",
      products_desc: orderData.items.map(item => `${item.name || "Product"} (Qty: ${item.quantity || 1})`).join(", "),
      quantity: orderData.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      weight: orderData.weight || 0.5, // Default 0.5kg if not specified
    };

    // Validate shipment data
    if (!shipment.name || !shipment.phone || !shipment.add || !shipment.pin || !shipment.city || !shipment.state) {
      console.error("❌ Invalid shipment data:", {
        hasName: !!shipment.name,
        hasPhone: !!shipment.phone,
        hasAddress: !!shipment.add,
        hasPin: !!shipment.pin,
        hasCity: !!shipment.city,
        hasState: !!shipment.state,
      });
      return {
        success: false,
        error: "Invalid shipment data",
        deliveryStatus: "NOT_SENT",
        isMock: false,
      };
    }

    // Prepare API payload
    const payload = {
      pickup_location: pickupLocation,
      shipments: [shipment],
    };

    // Make API call to Delhivery (REAL API)
    const apiUrl = `${API_BASE_URL}/api/cmu/create.json`;
    
    console.log("📦 Sending order to Delhivery (REAL API):", {
      orderId: orderData.orderId,
      apiUrl,
      paymentMode: shipment.payment_mode,
      totalAmount: shipment.total_amount,
      customerName: shipment.name,
      customerPin: shipment.pin,
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error("❌ Failed to parse Delhivery API response:", parseError);
      const textResponse = await response.text();
      console.error("Raw response:", textResponse);
      return {
        success: false,
        error: "Invalid response from Delhivery API",
        deliveryStatus: "NOT_SENT",
        isMock: false,
        rawResponse: textResponse,
      };
    }

    // Check if API call was successful
    if (!response.ok) {
      console.error("❌ Delhivery API error:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });
      return {
        success: false,
        error: responseData?.error || responseData?.message || `API error: ${response.status}`,
        deliveryStatus: "NOT_SENT",
        isMock: false,
        rawResponse: responseData,
      };
    }

    // Parse Delhivery response
    // Delhivery API returns: { packages: [{ waybill, ... }] }
    const packages = responseData?.packages || responseData?.package || [];
    
    if (!packages || packages.length === 0 || !packages[0]?.waybill) {
      console.error("❌ Delhivery response missing waybill:", responseData);
      return {
        success: false,
        error: "No waybill in Delhivery response",
        deliveryStatus: "NOT_SENT",
        isMock: false,
        rawResponse: responseData,
      };
    }

    const packageData = packages[0];
    const waybill = String(packageData.waybill || "").trim();

    // Validate waybill is real (numeric, not MOCK)
    if (!isValidWaybill(waybill)) {
      console.error("❌ Invalid waybill format (expected numeric):", waybill);
      return {
        success: false,
        error: `Invalid waybill format: ${waybill}`,
        deliveryStatus: "NOT_SENT",
        isMock: false,
        rawResponse: responseData,
      };
    }

    // Construct tracking URL
    const trackingUrl = `https://www.delhivery.com/track/${waybill}`;

    console.log("✅ Delhivery order created successfully (REAL):", {
      orderId: orderData.orderId,
      waybill: waybill,
      courierName: packageData.courier_name || "Delhivery",
      trackingUrl: trackingUrl,
    });

    return {
      success: true,
      waybill: waybill,
      courier_name: packageData.courier_name || "Delhivery",
      delivery_status: packageData.status || "CREATED",
      tracking_url: trackingUrl,
      deliveryStatus: "SENT",
      isMock: false,
      rawResponse: responseData,
    };
  } catch (error) {
    console.error("❌ Delhivery service error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
      deliveryStatus: "NOT_SENT",
      isMock: false,
    };
  }
}

/**
 * Tracks a shipment by waybill number using Delhivery Tracking API
 * 
 * @param {string} waybill - Waybill number to track
 * @returns {Promise<Object>} - Tracking information from Delhivery
 */
export async function trackShipment(waybill) {
  try {
    if (!waybill || !isValidWaybill(waybill)) {
      return {
        success: false,
        error: "Invalid waybill number",
      };
    }

    const API_KEY = process.env.DELHIVERY_API_KEY;
    const API_BASE_URL = process.env.DELHIVERY_API_BASE_URL || "https://track.delhivery.com";
    const MOCK_MODE = process.env.DELHIVERY_MOCK === "true";

    if (MOCK_MODE) {
      console.log("🧪 Mock Mode: Simulating tracking for waybill:", waybill);
      return {
        success: true,
        waybill: waybill,
        status: "In Transit",
        isMock: true,
      };
    }

    if (!API_KEY) {
      return {
        success: false,
        error: "DELHIVERY_API_KEY not configured",
      };
    }

    // Delhivery Tracking API endpoint
    const apiUrl = `${API_BASE_URL}/api/v1/packages/?waybill=${waybill}`;

    console.log("🔍 Tracking shipment:", { waybill, apiUrl });

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Token ${API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Delhivery tracking API error:", {
        status: response.status,
        data: errorData,
      });
      return {
        success: false,
        error: errorData?.error || `API error: ${response.status}`,
      };
    }

    const trackingData = await response.json();
    console.log("✅ Tracking data retrieved:", { waybill, status: trackingData?.status });

    return {
      success: true,
      waybill: waybill,
      data: trackingData,
      isMock: false,
    };
  } catch (error) {
    console.error("❌ Tracking error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Checks if an order has already been sent to Delhivery
 * This prevents duplicate order creation (idempotent logic)
 * 
 * @param {Object} order - MongoDB order document
 * @returns {boolean} - True if order was already sent to Delhivery
 */
export function isOrderSentToDelhivery(order) {
  return !!(
    order?.delhiveryWaybill ||
    order?.delhiverySent === true ||
    order?.delhiveryAWB // Legacy field check
  );
}

/**
 * Helper function to verify Delhivery integration is working
 * Logs instructions for manual verification in Delhivery dashboard
 * 
 * @param {string} waybill - Waybill number to verify
 */
export function logVerificationInstructions(waybill) {
  if (!waybill || !isValidWaybill(waybill)) {
    console.warn("⚠️ Cannot verify: Invalid waybill number");
    return;
  }

  console.log("\n" + "=".repeat(60));
  console.log("📋 DELHIVERY VERIFICATION INSTRUCTIONS");
  console.log("=".repeat(60));
  console.log(`Waybill Number: ${waybill}`);
  console.log(`Tracking URL: https://www.delhivery.com/track/${waybill}`);
  console.log("\nTo verify in Delhivery Dashboard:");
  console.log("1. Login to https://track.delhivery.com");
  console.log("2. Navigate to 'Packages' or 'Orders' section");
  console.log("3. Search for waybill:", waybill);
  console.log("4. Verify order details match your system");
  console.log("=".repeat(60) + "\n");
}