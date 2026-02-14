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
/**
 * Gets Delhivery API key from environment variables
 * Supports both DELHIVERY_API_KEY and DELHIVERY_API_TOKEN for backward compatibility
 * Prefers DELHIVERY_API_KEY if both are set
 */
function getDelhiveryApiKey() {
  return process.env.DELHIVERY_API_KEY || process.env.DELHIVERY_API_TOKEN;
}

/**
 * Masks API key in logs for security
 * Shows only first 6 characters, rest as asterisks
 * 
 * @param {string} apiKey - API key to mask
 * @returns {string} - Masked API key (e.g., "abcd12******")
 */
function maskApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== "string" || apiKey.length <= 6) {
    return "******";
  }
  return apiKey.substring(0, 6) + "*".repeat(Math.min(apiKey.length - 6, 10));
}

function logDelhiveryConfig() {
  const apiKey = getDelhiveryApiKey();
  const hasApiKey = !!apiKey;
  const mockMode = process.env.DELHIVERY_MOCK === "true";
  const baseUrl = process.env.DELHIVERY_API_BASE_URL || "https://track.delhivery.com";
  const nodeEnv = process.env.NODE_ENV;
  
  console.log("🔧 Delhivery Configuration:", {
    mode: mockMode ? "MOCK" : "REAL",
    hasApiKey: hasApiKey,
    apiBaseUrl: baseUrl,
    nodeEnv: nodeEnv,
    mockFlag: process.env.DELHIVERY_MOCK || "not set",
    envVarUsed: process.env.DELHIVERY_API_KEY ? "DELHIVERY_API_KEY" : (process.env.DELHIVERY_API_TOKEN ? "DELHIVERY_API_TOKEN" : "none"),
  });
}

/**
 * Sanitizes text by removing unicode characters (non-ASCII) to prevent Delhivery API errors
 * Replaces unicode characters with "-" and trims the result
 * 
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text with only ASCII characters
 */
export function sanitizeText(text) {
  if (!text || typeof text !== "string") return text || "";
  return text
    .replace(/[^\x00-\x7F]/g, "-") // Remove unicode characters (replace with "-")
    .trim();
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
 * City abbreviation to full name mapping
 * Common Indian city abbreviations that cause Delhivery API errors
 */
const CITY_ABBREVIATION_MAP = {
  "akp": "Anakapalli",
  "hyd": "Hyderabad",
  "mum": "Mumbai",
  "del": "Delhi",
  "blr": "Bangalore",
  "chn": "Chennai",
  "kol": "Kolkata",
  "pune": "Pune", // Already full, but included for consistency
  "ahm": "Ahmedabad",
  "jpr": "Jaipur",
  "lko": "Lucknow",
  "kan": "Kanpur",
  "nag": "Nagpur",
  "ind": "Indore",
  "thr": "Thane",
  "bho": "Bhopal",
  "vis": "Visakhapatnam",
  "pat": "Patna",
  "vad": "Vadodara",
  "gur": "Gurgaon",
  "coi": "Coimbatore",
  "mad": "Madurai",
  "vij": "Vijayawada",
  "raj": "Rajahmundry",
  "gnt": "Guntur",
  "kak": "Kakinada",
  "elr": "Eluru",
  "tad": "Tadepalligudem",
  "ong": "Ongole",
  "chir": "Chirala",
  "bza": "Bhimavaram",
  "nrt": "Narasaraopet",
  "nlr": "Nellore",
  "tir": "Tirupati",
  "kdp": "Kadapa",
  "anr": "Anantapur",
  "kum": "Kurnool",
  "nzb": "Nizamabad",
  "kar": "Karimnagar",
  "war": "Warangal",
  "khmm": "Khammam",
  "mdm": "Mahbubnagar",
  "ngd": "Nalgonda",
  "skt": "Srikakulam",
  "vzm": "Vizianagaram",
  "pkl": "Prakasam",
  "kri": "Krishna",
  "wgl": "West Godavari",
  "egl": "East Godavari",
};

/**
 * Normalizes city name by expanding abbreviations
 * 
 * @param {string} city - City name (may be abbreviated)
 * @returns {string} - Full city name
 */
function normalizeCity(city) {
  if (!city || typeof city !== "string") return city || "";
  
  const cityTrimmed = city.trim();
  if (cityTrimmed.length === 0) return "";
  
  // Check if city is an abbreviation (typically 3-4 characters, all caps or mixed case)
  const cityLower = cityTrimmed.toLowerCase();
  
  // If it's a known abbreviation, expand it
  if (CITY_ABBREVIATION_MAP[cityLower]) {
    return CITY_ABBREVIATION_MAP[cityLower];
  }
  
  // If city is very short (<= 4 chars) and looks like an abbreviation, try to match
  // This handles cases like "Akp" -> "Anakapalli"
  if (cityTrimmed.length <= 4 && cityTrimmed.length >= 2) {
    // Check for partial matches (e.g., "Akp" matches "Anakapalli" start)
    const possibleMatch = Object.entries(CITY_ABBREVIATION_MAP).find(
      ([abbr]) => abbr.startsWith(cityLower) || cityLower.startsWith(abbr)
    );
    if (possibleMatch) {
      return possibleMatch[1];
    }
  }
  
  // Return original city if no abbreviation found
  return cityTrimmed;
}

/**
 * Validates if city is a full name (not abbreviated)
 * 
 * @param {string} city - City name to validate
 * @returns {boolean} - True if city appears to be a full name
 */
function isValidCityName(city) {
  if (!city || typeof city !== "string") return false;
  
  const cityTrimmed = city.trim();
  if (cityTrimmed.length === 0) return false;
  
  // Full city names are typically longer than 4 characters
  // Very short names (<= 4 chars) are likely abbreviations
  if (cityTrimmed.length <= 4) {
    // Check if it's a known abbreviation
    const cityLower = cityTrimmed.toLowerCase();
    if (CITY_ABBREVIATION_MAP[cityLower]) {
      return false; // It's an abbreviation
    }
    // Very short names are suspicious
    return false;
  }
  
  // Check if normalized version differs from original (indicates abbreviation)
  const normalized = normalizeCity(cityTrimmed);
  if (normalized.toLowerCase() !== cityTrimmed.toLowerCase() && normalized.length > cityTrimmed.length) {
    return false; // Was an abbreviation
  }
  
  return true;
}

/**
 * Normalizes address to ensure it's detailed enough
 * 
 * @param {string} address - Address string
 * @param {string} area - Area/locality (optional)
 * @param {string} city - City name (optional)
 * @returns {string} - Normalized full address
 */
function normalizeAddress(address, area = "", city = "") {
  if (!address || typeof address !== "string") address = "";
  
  let fullAddress = address.trim();
  
  // If address is too short, try to enhance it with area and city
  if (fullAddress.length < 20) {
    const parts = [];
    if (fullAddress) parts.push(fullAddress);
    if (area && typeof area === "string" && area.trim()) parts.push(area.trim());
    if (city && typeof city === "string" && city.trim()) parts.push(city.trim());
    
    fullAddress = parts.join(", ");
  }
  
  return fullAddress.trim();
}

/**
 * Validates if address is detailed enough (>= 20 characters)
 * 
 * @param {string} address - Address string to validate
 * @returns {boolean} - True if address is detailed enough
 */
function isValidAddress(address) {
  if (!address || typeof address !== "string") return false;
  return address.trim().length >= 20;
}

/**
 * Validates shipment data before sending to Delhivery
 * 
 * @param {Object} shipment - Shipment object to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateShipmentData(shipment) {
  const errors = [];
  
  // Check city
  if (!shipment.city || !isValidCityName(shipment.city)) {
    errors.push(`City must be a full name (not abbreviated). Received: "${shipment.city}"`);
  }
  
  // Check address
  if (!shipment.add || !isValidAddress(shipment.add)) {
    errors.push(`Address must be detailed (at least 20 characters). Received length: ${shipment.add?.length || 0}`);
  }
  
  // CRITICAL: Validate mandatory numeric dimensions (Delhivery Python backend crashes if missing or wrong type)
  // These fields MUST be numbers, not strings, or Delhivery throws: "'unicode' object has no attribute 'get'"
  if (shipment.weight === undefined || shipment.weight === null || typeof shipment.weight !== "number" || isNaN(shipment.weight)) {
    errors.push(`weight must be a valid number. Received: ${shipment.weight} (type: ${typeof shipment.weight})`);
  }
  
  if (shipment.shipment_length === undefined || shipment.shipment_length === null || typeof shipment.shipment_length !== "number" || isNaN(shipment.shipment_length)) {
    errors.push(`shipment_length must be a valid number. Received: ${shipment.shipment_length} (type: ${typeof shipment.shipment_length})`);
  }
  
  if (shipment.shipment_breadth === undefined || shipment.shipment_breadth === null || typeof shipment.shipment_breadth !== "number" || isNaN(shipment.shipment_breadth)) {
    errors.push(`shipment_breadth must be a valid number. Received: ${shipment.shipment_breadth} (type: ${typeof shipment.shipment_breadth})`);
  }
  
  if (shipment.shipment_height === undefined || shipment.shipment_height === null || typeof shipment.shipment_height !== "number" || isNaN(shipment.shipment_height)) {
    errors.push(`shipment_height must be a valid number. Received: ${shipment.shipment_height} (type: ${typeof shipment.shipment_height})`);
  }
  
  // Validate string fields are strings
  if (typeof shipment.pin !== "string") {
    errors.push(`pin must be a string. Received: ${shipment.pin} (type: ${typeof shipment.pin})`);
  }
  
  if (typeof shipment.phone !== "string") {
    errors.push(`phone must be a string. Received: ${shipment.phone} (type: ${typeof shipment.phone})`);
  }
  
  if (typeof shipment.order !== "string") {
    errors.push(`order must be a string. Received: ${shipment.order} (type: ${typeof shipment.order})`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if a shipment already exists for an order (idempotency check)
 * 
 * @param {string} orderId - MongoDB order ID
 * @returns {Promise<Object|null>} - Existing order with shipment data, or null if not found
 */
async function checkExistingShipment(orderId) {
  try {
    const { connectDB } = await import("@/app/lib/db");
    const Order = (await import("@/app/models/Order")).default;
    
    await connectDB();
    
    const existingOrder = await Order.findById(orderId).select(
      "delhiveryWaybill delhiveryAWB isShipmentCreated orderNumber"
    );
    
    if (existingOrder && (existingOrder.delhiveryWaybill || existingOrder.delhiveryAWB || existingOrder.isShipmentCreated)) {
      return existingOrder;
    }
    
    return null;
  } catch (error) {
    console.error("❌ Error checking existing shipment:", error);
    // Don't throw - allow shipment creation to proceed if check fails
    return null;
  }
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
    const API_KEY = getDelhiveryApiKey();
    const API_BASE_URL = process.env.DELHIVERY_API_BASE_URL || "https://track.delhivery.com";
    const MOCK_MODE = process.env.DELHIVERY_MOCK === "true";

    // MOCK MODE: Only enabled when DELHIVERY_MOCK is explicitly "true"
    // REAL MODE: Used when DELHIVERY_MOCK !== "true" AND API_KEY exists
    if (MOCK_MODE) {
      console.log("🧪 Delhivery Mock Mode: Simulating order creation");
      const mockWaybill = `MOCK${Date.now()}`;
      return {
        success: true,
        awb: mockWaybill,
        waybill: mockWaybill,
        provider: "delhivery",
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
      console.warn("⚠️ Please set either DELHIVERY_API_KEY or DELHIVERY_API_TOKEN in environment variables.");
      return {
        success: false,
        error: "DELHIVERY_API_KEY or DELHIVERY_API_TOKEN not configured",
        provider: "delhivery",
        stage: "shipment_creation",
        orderId: orderData.orderId,
        deliveryStatus: "PENDING",
        shipment_status: "PENDING",
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
        provider: "delhivery",
        deliveryStatus: "PENDING",
        shipment_status: "PENDING",
        isMock: false,
      };
    }

    // DUPLICATE SHIPMENT PROTECTION: Check if shipment already exists
    const existingShipment = await checkExistingShipment(orderData.orderId);
    if (existingShipment) {
      const existingAWB = existingShipment.delhiveryWaybill || existingShipment.delhiveryAWB;
      console.log("⚠️ Shipment already exists, skipping creation:", {
        orderId: orderData.orderId,
        orderNumber: existingShipment.orderNumber || "N/A",
        existingAWB: existingAWB || "N/A",
        isShipmentCreated: existingShipment.isShipmentCreated,
      });
      
      // Return existing shipment data if available
      if (existingAWB) {
        return {
          success: true,
          awb: existingAWB,
          waybill: existingAWB,
          provider: "delhivery",
          deliveryStatus: "SENT",
          shipment_status: "SHIPPED",
          isMock: false,
          alreadyExists: true,
          tracking_url: `https://www.delhivery.com/track/${existingAWB}`,
        };
      }
      
      return {
        success: false,
        error: "Shipment already exists, skipping.",
        provider: "delhivery",
        deliveryStatus: "PENDING",
        shipment_status: "PENDING",
        isMock: false,
        alreadyExists: true,
      };
    }

    // Get pickup location name from environment variable
    // IMPORTANT: This must EXACTLY match one of the active pickup location names in Delhivery dashboard
    // Active locations: "SOULSEAM C2C", "Soul seam 2"
    let pickupLocationName = process.env.DELHIVERY_PICKUP_NAME?.trim();
    let usingFallback = false;
    
    // Validate pickup location name exists and is not empty
    if (!pickupLocationName || pickupLocationName.length === 0) {
      // Safe fallback ONLY for local development (not production)
      if (process.env.NODE_ENV !== "production") {
        pickupLocationName = "SOULSEAM C2C";
        usingFallback = true;
        console.log("⚠️ DELHIVERY_PICKUP_NAME not set. Using local dev fallback:", {
          fallback: `"${pickupLocationName}"`,
          nodeEnv: process.env.NODE_ENV,
          note: "This fallback is ONLY for local development. Production requires DELHIVERY_PICKUP_NAME to be set.",
        });
      } else {
        // Production: REQUIRE the environment variable
        const errorMsg = "DELHIVERY_PICKUP_NAME environment variable is missing or empty. Must match exact pickup location name from Delhivery dashboard (e.g., 'SOULSEAM C2C' or 'Soul seam 2')";
        console.error("❌", errorMsg);
        return {
          success: false,
          error: errorMsg,
          provider: "delhivery",
          stage: "shipment_creation",
          orderId: orderData.orderId,
          deliveryStatus: "PENDING",
          shipment_status: "PENDING",
          isMock: false,
        };
      }
    }

    // Debug log: Print the pickup location being used (case-sensitive)
    console.log("📍 Delhivery Pickup Location:", {
      name: pickupLocationName,
      length: pickupLocationName.length,
      exactMatch: `"${pickupLocationName}"`,
      usingFallback: usingFallback,
      nodeEnv: process.env.NODE_ENV,
      note: "Must exactly match dashboard pickup location name (case-sensitive)",
    });

    // Prepare shipment data
    const shippingAddress = orderData.shippingAddress;
    const fullName = shippingAddress.fullName || `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim();
    const isCOD = orderData.paymentMethod === "COD";
    
    // Extract raw address fields
    const rawCity = shippingAddress.city || "";
    const rawAddress = shippingAddress.addressLine1 || shippingAddress.address || "";
    const rawArea = shippingAddress.area || shippingAddress.locality || "";
    
    // Normalize city and address BEFORE creating shipment
    const normalizedCity = normalizeCity(rawCity);
    const normalizedAddress = normalizeAddress(rawAddress, rawArea, normalizedCity);
    
    // Log normalization changes for debugging
    if (normalizedCity !== rawCity || normalizedAddress !== rawAddress) {
      console.log("🔄 Address normalization applied:", {
        original_city: rawCity,
        normalized_city: normalizedCity,
        original_address: rawAddress,
        normalized_address: normalizedAddress,
        address_length: normalizedAddress.length,
      });
    }
    
    // CRITICAL: Delhivery CMU Python backend requires ALL numeric fields to be numbers (not strings)
    // Missing or string-typed dimensions cause: "'unicode' object has no attribute 'get'"
    // Default dimensions (in cm): 20x15x10 (standard small package)
    const defaultLength = 20;
    const defaultBreadth = 15;
    const defaultHeight = 10;
    const defaultWeight = 0.5; // kg

    // CRITICAL: products_desc MUST be a STRING (comma-separated), not an array
    // Delhivery's Python backend expects products_desc as a string
    // Sending as array/object causes: "'unicode' object has no attribute 'get'" error
    const totalQuantity = Number(orderData.items.reduce((sum, item) => sum + (item.quantity || 1), 0));
    const totalAmount = Number(orderData.totalAmount || 0);
    const productsDesc = Array.isArray(orderData.items) && orderData.items.length > 0
      ? orderData.items
          .map(item => {
            // Sanitize product name to remove unicode characters
            const rawItemName = String(item.name || item.title || item.productName || item.product?.name || "Item").substring(0, 100);
            const itemName = sanitizeText(rawItemName);
            const itemQuantity = Number(item.quantity || 1);
            return `${itemName} x${itemQuantity}`;
          })
          .join(", ")
      : `Item x${totalQuantity || 1}`;

    const shipment = {
      name: sanitizeText(fullName || "Customer"), // Sanitize customer name
      add: sanitizeText(normalizedAddress), // Sanitize address
      city: sanitizeText(normalizedCity), // Sanitize city
      state: sanitizeText(shippingAddress.state || ""), // Sanitize state
      pin: String(shippingAddress.pincode || shippingAddress.pin || ""), // MUST be string
      country: "India",
      phone: String(shippingAddress.phone || ""), // MUST be string
      order: String(orderData.orderId), // MUST be string
      payment_mode: isCOD ? "COD" : "Prepaid",
      // CRITICAL: products_desc MUST be a STRING (comma-separated), not an array
      // Delhivery's Python backend expects products_desc as a string
      products_desc: sanitizeText(productsDesc), // Sanitize products_desc
      quantity: totalQuantity, // MUST be number
      weight: Number(orderData.weight || defaultWeight), // MUST be number (kg)
      shipment_length: Number(orderData.shipment_length || defaultLength), // MUST be number (cm)
      shipment_breadth: Number(orderData.shipment_breadth || defaultBreadth), // MUST be number (cm)
      shipment_height: Number(orderData.shipment_height || defaultHeight), // MUST be number (cm)
    };

    // Add cod_amount only for COD orders (mandatory field for COD)
    // CRITICAL: COD requires cod_amount > 0
    if (isCOD) {
      const codAmount = Number(orderData.totalAmount);
      if (!codAmount || codAmount <= 0) {
        console.error("❌ Invalid COD amount:", {
          orderId: orderData.orderId,
          codAmount: codAmount,
          totalAmount: orderData.totalAmount,
          note: "COD orders require cod_amount > 0",
        });
        return {
          success: false,
          error: "COD orders require cod_amount > 0",
          provider: "delhivery",
          stage: "shipment_creation",
          orderId: orderData.orderId,
          deliveryStatus: "PENDING",
          shipment_status: "PENDING",
          isMock: false,
        };
      }
      shipment.cod_amount = codAmount; // MUST be number > 0
    }

    // Validate shipment data - ensure all mandatory fields are present
    if (!shipment.name || !shipment.phone || !shipment.add || !shipment.pin || !shipment.city || !shipment.state) {
      console.error("❌ Invalid shipment data (missing mandatory fields):", {
        hasName: !!shipment.name,
        hasPhone: !!shipment.phone,
        hasAddress: !!shipment.add,
        hasPin: !!shipment.pin,
        hasCity: !!shipment.city,
        hasState: !!shipment.state,
        hasCountry: !!shipment.country,
        hasOrder: !!shipment.order,
        hasPaymentMode: !!shipment.payment_mode,
        hasQuantity: shipment.quantity !== undefined,
        hasWeight: shipment.weight !== undefined,
        hasShipmentLength: shipment.shipment_length !== undefined,
        hasShipmentBreadth: shipment.shipment_breadth !== undefined,
        hasShipmentHeight: shipment.shipment_height !== undefined,
        hasCodAmount: shipment.cod_amount !== undefined || !isCOD,
      });
      return {
        success: false,
        error: "Invalid shipment data - missing mandatory fields",
        provider: "delhivery",
        stage: "shipment_creation",
        orderId: orderData.orderId,
        deliveryStatus: "PENDING",
        shipment_status: "PENDING",
        isMock: false,
      };
    }
    
    // CRITICAL: Validate mandatory numeric dimensions before API call
    // Delhivery Python backend crashes with "'unicode' object has no attribute 'get'" if dimensions are missing or strings
    const dimensionErrors = [];
    if (shipment.weight === undefined || shipment.weight === null || typeof shipment.weight !== "number" || isNaN(shipment.weight)) {
      dimensionErrors.push(`weight must be a number (received: ${shipment.weight}, type: ${typeof shipment.weight})`);
    }
    if (shipment.shipment_length === undefined || shipment.shipment_length === null || typeof shipment.shipment_length !== "number" || isNaN(shipment.shipment_length)) {
      dimensionErrors.push(`shipment_length must be a number (received: ${shipment.shipment_length}, type: ${typeof shipment.shipment_length})`);
    }
    if (shipment.shipment_breadth === undefined || shipment.shipment_breadth === null || typeof shipment.shipment_breadth !== "number" || isNaN(shipment.shipment_breadth)) {
      dimensionErrors.push(`shipment_breadth must be a number (received: ${shipment.shipment_breadth}, type: ${typeof shipment.shipment_breadth})`);
    }
    if (shipment.shipment_height === undefined || shipment.shipment_height === null || typeof shipment.shipment_height !== "number" || isNaN(shipment.shipment_height)) {
      dimensionErrors.push(`shipment_height must be a number (received: ${shipment.shipment_height}, type: ${typeof shipment.shipment_height})`);
    }
    
    if (dimensionErrors.length > 0) {
      console.error("❌ Invalid shipment dimensions (preventing Delhivery API call):", {
        orderId: orderData.orderId,
        errors: dimensionErrors,
        weight: shipment.weight,
        shipment_length: shipment.shipment_length,
        shipment_breadth: shipment.shipment_breadth,
        shipment_height: shipment.shipment_height,
        note: "Delhivery Python backend crashes if dimensions are missing or not numbers. Shipment will NOT be sent.",
      });
      return {
        success: false,
        error: `Missing or invalid shipment dimensions: ${dimensionErrors.join("; ")}`,
        provider: "delhivery",
        stage: "shipment_creation",
        orderId: orderData.orderId,
        deliveryStatus: "PENDING",
        shipment_status: "PENDING",
        isMock: false,
      };
    }
    
    // STRICT VALIDATION: Validate city and address format before calling Delhivery
    // This prevents Delhivery backend crashes from invalid data
    const validation = validateShipmentData(shipment);
    if (!validation.valid) {
      console.error("❌ Shipment validation failed (preventing Delhivery API call):", {
        orderId: orderData.orderId,
        errors: validation.errors,
        original_city: rawCity,
        normalized_city: normalizedCity,
        original_address: rawAddress,
        normalized_address: normalizedAddress,
        address_length: normalizedAddress.length,
        note: "Shipment will NOT be sent to Delhivery. Status set to PENDING.",
      });
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join("; ")}`,
        provider: "delhivery",
        stage: "shipment_creation",
        orderId: orderData.orderId,
        deliveryStatus: "PENDING",
        shipment_status: "PENDING",
        isMock: false,
      };
    }

    // Prepare API payload
    // CRITICAL FIX: pickup_location MUST be a STRING, not an object
    // Delhivery CMU API expects: "Soul seam 2" (string), NOT {"name": "Soul seam 2"} (object)
    // Sending as object causes: "'unicode' object has no attribute 'get'" error
    // CRITICAL: Ensure all numeric fields remain as numbers (not strings) in the final JSON
    
    // Sanitize shipment: Remove null/undefined fields and "N/A" values to prevent parsing errors
    // Keep empty strings for required fields that might be empty
    // CRITICAL: products_desc MUST be included as an array (already set above)
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
      console.error("❌ Invalid products_desc (must be non-empty string):", {
        orderId: orderData.orderId,
        products_desc: sanitizedShipment.products_desc,
        type: typeof sanitizedShipment.products_desc,
      });
      return {
        success: false,
        error: "products_desc must be a non-empty string",
        provider: "delhivery",
        stage: "shipment_creation",
        orderId: orderData.orderId,
        deliveryStatus: "PENDING",
        shipment_status: "PENDING",
        isMock: false,
      };
    }
    
    // Validate payload before sending - ensure products_desc is a string
    console.log(typeof sanitizedShipment.products_desc);
    
    // Validate that 'add' key exists (not 'address')
    if (!sanitizedShipment.add) {
      console.error("❌ Missing 'add' field in shipment (address key must be 'add', not 'address'):", {
        orderId: orderData.orderId,
        shipmentKeys: Object.keys(sanitizedShipment),
      });
      return {
        success: false,
        error: "Missing 'add' field in shipment. Address key must be 'add', not 'address'",
        provider: "delhivery",
        stage: "shipment_creation",
        orderId: orderData.orderId,
        deliveryStatus: "PENDING",
        shipment_status: "PENDING",
        isMock: false,
      };
    }
    
    // Build payload with proper structure
    // CRITICAL: pickup_location must be a plain STRING, not an object or escaped string
    // Ensure no escaped quotes in pickup_location
    let pickupLocationClean = pickupLocationName;
    if (typeof pickupLocationClean === "string") {
      // Remove any escaped quotes that might have been added
      pickupLocationClean = pickupLocationClean.replace(/^["']|["']$/g, "").trim();
    }
    
    const payload = {
      // Optional: Add client name if configured (from ENV)
      ...(process.env.DELHIVERY_CLIENT ? { client: process.env.DELHIVERY_CLIENT } : {}),
      // CRITICAL: pickup_location must be STRING, not object, no escaped quotes
      pickup_location: pickupLocationClean,
      shipments: [sanitizedShipment],
    };

    // CRITICAL: Validate JSON structure before stringifying to ensure proper format
    // This ensures numeric values stay as numbers (not strings) in the final JSON
    // Delhivery's Python backend expects numbers, not strings, for numeric fields
    const payloadString = JSON.stringify(payload);
    
    // Verify the JSON string contains proper numeric values (not string numbers)
    // This is a sanity check to ensure JSON.stringify preserved numbers correctly
    try {
      const parsed = JSON.parse(payloadString);
      const firstShipment = parsed.shipments?.[0];
      if (firstShipment) {
        // Ensure critical numeric fields are actually numbers
        const numericFields = ['weight', 'shipment_length', 'shipment_breadth', 'shipment_height', 'quantity'];
        if (firstShipment.cod_amount !== undefined) numericFields.push('cod_amount');
        
        for (const field of numericFields) {
          if (firstShipment[field] !== undefined && typeof firstShipment[field] !== 'number') {
            console.warn(`⚠️ Warning: ${field} is not a number in payload:`, typeof firstShipment[field], firstShipment[field]);
          }
        }
      }
    } catch (e) {
      console.error("❌ Failed to validate JSON payload structure:", e);
    }

    // STRONG LOGGING: Before request
    const maskedApiKey = maskApiKey(API_KEY);
    
    // Prepare form-encoded body
    // CRITICAL: Delhivery CMU API is a legacy form API and requires:
    // Content-Type: application/x-www-form-urlencoded
    // Body: format=json&data=<STRINGIFIED_JSON>
    const formData = new URLSearchParams();
    formData.append("format", "json");
    formData.append("data", payloadString);
    
    console.log("📤 Delhivery API Request - BEFORE:", {
      orderId: orderData.orderId,
      apiUrl: `${API_BASE_URL}/api/cmu/create.json`,
      headers: {
        "Authorization": `Token ${maskedApiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      payload: {
        pickup_location: payload.pickup_location,
        client: payload.client || "N/A (not configured)",
        shipment_count: payload.shipments.length,
        order_id: sanitizedShipment.order,
        payment_mode: sanitizedShipment.payment_mode,
        customer_pin: sanitizedShipment.pin,
        cod_amount: sanitizedShipment.cod_amount !== undefined ? sanitizedShipment.cod_amount : undefined,
        customer_name: sanitizedShipment.name,
        customer_city: sanitizedShipment.city,
        customer_state: sanitizedShipment.state,
        address_length: sanitizedShipment.add?.length || 0,
        address_preview: sanitizedShipment.add?.substring(0, 50) + (sanitizedShipment.add?.length > 50 ? "..." : "") || "N/A",
        weight: sanitizedShipment.weight,
        shipment_length: sanitizedShipment.shipment_length,
        shipment_breadth: sanitizedShipment.shipment_breadth,
        shipment_height: sanitizedShipment.shipment_height,
      },
      note: "Sending form-encoded body (format=json&data=<STRINGIFIED_JSON>)",
    });
    
    // Log full payload for debugging (safe - no sensitive payment data)
    console.log("📋 Full Payload (JSON):", JSON.stringify(payload, null, 2));

    // Make API call to Delhivery (REAL API) with retry logic
    // CRITICAL: Delhivery CMU API is a legacy form API and requires form-encoded body
    const apiUrl = `${API_BASE_URL}/api/cmu/create.json`;

    // SAFE RETRY LOGIC: Only retry on network errors and 5xx errors
    // Do NOT retry for: 400, 401, 403 (client errors)
    const maxRetries = 2; // Max 2 retries (3 total attempts)
    const baseDelay = 2000; // 2 seconds
    let lastError = null;
    let lastResponse = null;
    let lastResponseData = null;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        if (attempt > 1) {
          const delay = baseDelay * Math.pow(2, attempt - 2); // Exponential backoff: 2s, 4s
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries + 1} after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Log headers once to confirm content-type is correct (only on first attempt)
        if (attempt === 1) {
          console.log("✅ Request headers confirmed:", {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Token ${maskedApiKey}`,
          });
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Token ${API_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(), // Form-encoded body: format=json&data=<STRINGIFIED_JSON>
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        lastResponse = response;
        let responseData;
        
        try {
          responseData = await response.json();
          lastResponseData = responseData;
        } catch (parseError) {
          console.error("❌ Failed to parse Delhivery API response:", parseError);
          const textResponse = await response.text();
          console.error("Raw response:", textResponse);
          
          // If it's the last attempt, return error
          if (attempt === maxRetries + 1) {
            return {
              success: false,
              error: "Invalid response from Delhivery API",
              provider: "delhivery",
              stage: "shipment_creation",
              orderId: orderData.orderId,
              deliveryStatus: "PENDING",
              shipment_status: "PENDING",
              isMock: false,
              rawResponse: textResponse,
            };
          }
          // Otherwise, retry (only if 5xx error)
          if (response.status >= 500) {
            lastError = parseError;
            continue;
          }
          // Don't retry for non-5xx errors
          return {
            success: false,
            error: "Invalid response from Delhivery API",
            provider: "delhivery",
            stage: "shipment_creation",
            orderId: orderData.orderId,
            deliveryStatus: "PENDING",
            shipment_status: "PENDING",
            isMock: false,
            rawResponse: textResponse,
          };
        }

        // STRONG LOGGING: After response
        console.log("📥 Delhivery API Response - AFTER:", {
          orderId: orderData.orderId,
          status: response.status,
          statusText: response.statusText,
          success: responseData?.success,
          awb: responseData?.packages?.[0]?.waybill || responseData?.upload_wbn || "N/A",
          fullResponse: responseData,
        });

        // Check if API call was successful (HTTP status)
        if (!response.ok) {
          const errorMessage = responseData?.error || responseData?.message || responseData?.rmk || `API error: ${response.status}`;
          
          // Check if package was created despite error (half-success scenario)
          const packages = responseData?.packages || responseData?.package || [];
          const uploadWbn = responseData?.upload_wbn;
          const packageCount = responseData?.package_count || packages?.length || 0;
          const hasWaybill = packages?.[0]?.waybill;
          
          // If package was created (upload_wbn or package_count > 0), treat as success, don't retry
          if (uploadWbn || (packageCount > 0 && hasWaybill)) {
            console.log("✅ Delhivery returned error but package was created (half-success). Treating as success:", {
              status: response.status,
              error: errorMessage,
              upload_wbn: uploadWbn || "N/A",
              package_count: packageCount,
              has_waybill: !!hasWaybill,
            });
            // Break out of retry loop - we'll handle this in response parsing
            break;
          }
          
          // SAFE RETRY LOGIC: Only retry for 5xx errors and network errors
          // Do NOT retry for: 400, 401, 403 (client errors)
          const isRetryableError = response.status >= 500; // Only 5xx errors
          const errorMsgStr = typeof errorMessage === "string" ? errorMessage : String(errorMessage || "");
          
          if (!isRetryableError || attempt === maxRetries + 1) {
            // Don't retry for client errors (4xx) or if last attempt
            console.error("❌ Delhivery API error (non-retryable or last attempt):", {
              status: response.status,
              statusText: response.statusText,
              error: errorMessage,
              pickup_location_used: payload.pickup_location,
              attempt,
            });
            
            // Throw structured error for Delhivery failures
            if (responseData?.success === false) {
              throw {
                provider: "delhivery",
                stage: "shipment_creation",
                orderId: orderData.orderId,
                response: responseData,
                error: errorMessage,
              };
            }
            
            return {
              success: false,
              error: errorMessage,
              provider: "delhivery",
              stage: "shipment_creation",
              orderId: orderData.orderId,
              deliveryStatus: "PENDING",
              shipment_status: "PENDING",
              isMock: false,
              rawResponse: responseData,
            };
          }
          
          // Retry for 5xx errors (only if no package was created)
          console.warn(`⚠️ Delhivery API error (attempt ${attempt}/${maxRetries + 1}), will retry:`, {
            status: response.status,
            error: errorMessage,
            note: "5xx error detected, retrying...",
          });
          lastError = new Error(errorMessage);
          continue;
        }

        // Success - break out of retry loop
        break;
        
      } catch (fetchError) {
        lastError = fetchError;
        
        // Check if it's a structured error (from Delhivery response)
        if (fetchError.provider === "delhivery") {
          return {
            success: false,
            error: fetchError.error || "Shipment creation failed",
            provider: fetchError.provider,
            stage: fetchError.stage,
            orderId: fetchError.orderId,
            deliveryStatus: "PENDING",
            shipment_status: "PENDING",
            isMock: false,
            rawResponse: fetchError.response,
          };
        }
        
        // Check if it's a timeout or network error (retryable)
        const isRetryable = 
          fetchError.name === "AbortError" ||
          fetchError.name === "TimeoutError" ||
          fetchError.message?.includes("network") ||
          fetchError.message?.includes("timeout") ||
          fetchError.message?.includes("ECONNREFUSED") ||
          fetchError.message?.includes("ENOTFOUND");
        
        if (!isRetryable || attempt === maxRetries + 1) {
          // Don't retry for non-retryable errors or if last attempt
          console.error("❌ Delhivery API fetch error (non-retryable or last attempt):", fetchError);
          return {
            success: false,
            error: fetchError.message || "Network error",
            provider: "delhivery",
            stage: "shipment_creation",
            orderId: orderData.orderId,
            deliveryStatus: "PENDING",
            shipment_status: "PENDING",
            isMock: false,
          };
        }
        
        console.warn(`⚠️ Delhivery API fetch error (attempt ${attempt}/${maxRetries + 1}), will retry:`, fetchError.message);
      }
    }

    // If we get here, we either succeeded or exhausted retries
    if (!lastResponse || !lastResponseData) {
      return {
        success: false,
        error: lastError?.message || "Failed after retries",
        deliveryStatus: "PENDING",
        shipment_status: "PENDING",
        isMock: false,
      };
    }

    const response = lastResponse;
    const responseData = lastResponseData;

    // Parse Delhivery response
    // Delhivery API returns: { packages: [{ waybill, ... }] } or { success: true, packages: [...] }
    // IMPORTANT: Delhivery sometimes returns success=false but still creates package (half-success scenario)
    // We should treat responses with upload_wbn OR package_count > 0 as SUCCESS
    
    // Safely extract all values from response with optional chaining
    const rmkValue = responseData?.rmk || null;
    const uploadWbn = responseData?.upload_wbn || null;
    const packageCount = responseData?.package_count || 0;
    const packages = responseData?.packages || responseData?.package || [];
    const hasWaybill = packages?.[0]?.waybill;
    
    // CRITICAL: Treat as SUCCESS if:
    // 1. success === true AND waybill exists (normal success)
    // 2. upload_wbn exists (package was created even if success=false)
    // 3. package_count > 0 (packages were created even if success=false)
    const isSuccess = 
      (responseData?.success === true && hasWaybill) ||
      (uploadWbn && uploadWbn.trim().length > 0) ||
      (packageCount > 0 && hasWaybill);
    
    if (!isSuccess) {
      // True failure case: No package created, no upload_wbn, no package_count
      // Extract error message with priority: rmk > message > fallback
      const errorMessage = 
        responseData?.rmk ||
        responseData?.message ||
        responseData?.error ||
        "Shipment creation failed";
      
      console.error("❌ Delhivery response indicates failure (no package created):", {
        success: responseData?.success,
        error: errorMessage,
        rmk: rmkValue || "N/A",
        upload_wbn: uploadWbn || "N/A",
        package_count: packageCount,
        has_packages: !!packages,
        pickup_location_used: pickupLocationName,
        fullResponse: responseData,
      });
      
      // Throw structured error for Delhivery failures
      return {
        success: false,
        error: errorMessage,
        provider: "delhivery",
        stage: "shipment_creation",
        orderId: orderData.orderId,
        deliveryStatus: "PENDING",
        shipment_status: "PENDING",
        isMock: false,
        rawResponse: responseData,
      };
    }
    
    // SUCCESS CASE: Package was created (even if success=false in response)
    // This handles the half-success scenario where Delhivery creates package but returns success=false
    // Wrap courier parsing in try/catch to prevent crashes from shipment errors
    try {
      if (uploadWbn && !hasWaybill) {
        // If we have upload_wbn but no waybill in packages, use upload_wbn as waybill
        console.log("⚠️ Delhivery returned upload_wbn but no waybill in packages. Using upload_wbn as waybill:", uploadWbn);
        const waybill = String(uploadWbn).trim();
        if (isValidWaybill(waybill)) {
          const trackingUrl = `https://www.delhivery.com/track/${waybill}`;
          console.log("✅ Delhivery order created successfully (using upload_wbn):", {
            orderId: orderData.orderId,
            waybill: waybill,
            trackingUrl: trackingUrl,
            note: "Delhivery returned success=false but created package (half-success scenario)",
          });
          return {
            success: true,
            awb: waybill,
            waybill: waybill,
            provider: "delhivery",
            courier_name: "Delhivery",
            delivery_status: "CREATED",
            tracking_url: trackingUrl,
            deliveryStatus: "SENT",
            shipment_status: "SHIPPED",
            isMock: false,
            rawResponse: responseData,
          };
        }
      }
      
      // Extract waybill from response (reached if package was created, even if success=false)
      const packageData = packages?.[0] || {};
      const waybill = String(packageData?.waybill || "").trim();

      // Validate waybill is real (numeric, not MOCK)
      if (!isValidWaybill(waybill)) {
        console.error("❌ Invalid waybill format (expected numeric):", waybill);
        return {
          success: false,
          error: `Invalid waybill format: ${waybill}`,
          provider: "delhivery",
          stage: "shipment_creation",
          orderId: orderData.orderId,
          deliveryStatus: "PENDING",
          shipment_status: "PENDING",
          isMock: false,
          rawResponse: responseData,
        };
      }

      // Construct tracking URL
      const trackingUrl = `https://www.delhivery.com/track/${waybill}`;

      // Log success (even if Delhivery returned success=false but created package)
      const wasHalfSuccess = responseData?.success === false && (uploadWbn || packageCount > 0);
      console.log(`✅ Delhivery order created successfully (REAL${wasHalfSuccess ? " - half-success scenario" : ""}):`, {
        orderId: orderData.orderId,
        awb: waybill,
        waybill: waybill,
        courierName: packageData?.courier_name || "Delhivery",
        trackingUrl: trackingUrl,
        delhiverySuccess: responseData?.success,
        upload_wbn: uploadWbn || "N/A",
        package_count: packageCount,
        note: wasHalfSuccess ? "Delhivery returned success=false but created package. Treating as success." : "Normal success response",
      });

      // STRONG LOGGING: Log AWB if generated
      console.log("📋 Delhivery Response Summary:", {
        success: true,
        awb: waybill,
        waybill: waybill,
        hasWaybill: !!waybill,
        packageCount: packages?.length || 0,
        pickup_location_used: pickupLocationName,
        order_id: orderData.orderId,
        note: "Shipment created successfully with form-encoded body",
      });

      // Success: Return structured response
      return {
        success: true,
        awb: waybill,
        waybill: waybill,
        provider: "delhivery",
        courier_name: packageData?.courier_name || "Delhivery",
        delivery_status: packageData?.status || "CREATED",
        tracking_url: trackingUrl,
        deliveryStatus: "SENT",
        shipment_status: "SHIPPED", // Set shipment_status to SHIPPED on success
        isMock: false,
        rawResponse: responseData,
      };
    } catch (parseError) {
      // Catch any errors during courier parsing to prevent API crashes
      console.error("❌ Error parsing Delhivery courier response:", parseError);
      return {
        success: false,
        error: `Failed to parse courier response: ${parseError?.message || "Unknown error"}`,
        provider: "delhivery",
        stage: "shipment_creation",
        orderId: orderData.orderId,
        deliveryStatus: "PENDING",
        shipment_status: "PENDING",
        isMock: false,
        rawResponse: responseData,
      };
    }
  } catch (error) {
    console.error("❌ Delhivery service error:", error);
    
    // If it's a structured error, return it as-is
    if (error.provider === "delhivery") {
      return {
        success: false,
        error: error.error || "Shipment creation failed",
        provider: error.provider,
        stage: error.stage,
        orderId: error.orderId,
        deliveryStatus: "PENDING",
        shipment_status: "PENDING",
        isMock: false,
        rawResponse: error.response,
      };
    }
    
    return {
      success: false,
      error: error.message || "Unknown error",
      provider: "delhivery",
      stage: "shipment_creation",
      orderId: orderData.orderId,
      deliveryStatus: "PENDING",
      shipment_status: "PENDING",
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

    const API_KEY = getDelhiveryApiKey();
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
        error: "DELHIVERY_API_KEY or DELHIVERY_API_TOKEN not configured",
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