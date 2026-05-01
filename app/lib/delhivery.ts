// This is the ONLY Delhivery utility file – delhivery.tsx deleted (old version)
// Use header auth for production, form-urlencoded body for create shipment

import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Delhivery API Utility
 * 
 * This utility handles communication with Delhivery API for shipment creation.
 * 
 * Environment Variables Required:
 * - DELHIVERY_BASE_URL: Base URL for Delhivery API (e.g., "https://track.delhivery.com" for production)
 * - DELHIVERY_TOKEN: API token for authentication
 * - DELHIVERY_WAREHOUSE_NAME: Name of your warehouse in Delhivery system
 * 
 * Production ready: Vercel lo add env vars: DELHIVERY_BASE_URL=https://track.delhivery.com, DELHIVERY_TOKEN=..., DELHIVERY_WAREHOUSE_NAME=Soul seam 2
 * Test: Local lo success ayithe Vercel lo redeploy + test low value order
 * 
 * Testing:
 * - Use Postman to test: POST /api/delhivery/create-shipment with { "orderId": "your_order_id" }
 * - Common errors:
 *   - "Client warehouse mismatch" → Check DELHIVERY_WAREHOUSE_NAME matches your Delhivery dashboard
 *   - "Low wallet balance" → Add funds to your Delhivery account
 *   - "Invalid pincode" → Verify pincode is serviceable by Delhivery
 *   - "format key missing in POST" → Fixed: ensure format: 'json' and data: JSON.stringify([payload])
 * 
 * After successful shipment creation:
 * - Check Delhivery One dashboard > Shipments > search by order_id
 * - AWB will be saved in order.delhiveryAWB and order.delhiveryWaybill
 */

// Safety check at top of file
if (!process.env.DELHIVERY_TOKEN) {
  console.error('[Delhivery] CRITICAL: DELHIVERY_TOKEN missing in .env.local');
}

// Add safety for production
if (process.env.DELHIVERY_BASE_URL?.includes('staging')) {
  console.warn('[Delhivery] Running in staging – switch to production for real shipments');
}
if (process.env.DELHIVERY_TOKEN && process.env.DELHIVERY_TOKEN.length < 30) {
  console.warn('[Delhivery] DELHIVERY_TOKEN looks invalid – regenerate');
}

// Create axios instance with base configuration (for staging shipment creation - uses query param token)
// Staging (staging-express.delhivery.com) works with ?token= query param
const delhiveryClient: AxiosInstance = axios.create({
  baseURL: process.env.DELHIVERY_BASE_URL || 'https://staging-express.delhivery.com',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests as query parameter (for staging shipment creation endpoint)
delhiveryClient.interceptors.request.use((config) => {
  console.log('[Delhivery Interceptor] Token from env:', process.env.DELHIVERY_TOKEN ? 'present (length: ' + process.env.DELHIVERY_TOKEN.length + ')' : 'MISSING');
  console.log('[Delhivery Interceptor] Config params before:', config.params);
  config.params = { ...config.params || {}, token: process.env.DELHIVERY_TOKEN };
  console.log('[Delhivery Interceptor] Config params after:', config.params);
  const baseURL = config.baseURL || '';
  const url = config.url || '';
  console.log('[Delhivery Interceptor] Full request URL preview:', baseURL + url + '?token=' + process.env.DELHIVERY_TOKEN);
  return config;
});

// Production (track.delhivery.com) requires Authorization: Token header
// Production endpoint /api/cmu/create.json requires Authorization: Token <token> header, not query param
// Staging lo query param works, production lo header mandatory
// Success ayithe waybill in response.packages[0].waybill
// Vercel lo BASE_URL=https://track.delhivery.com set cheyandi
// Fix: Delhivery production sometimes rejects stringified data – charset=UTF-8 added
const productionShipmentClient: AxiosInstance = axios.create({
  baseURL: process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    'Authorization': `Token ${process.env.DELHIVERY_TOKEN}`
  },
});
// Note: No query param interceptor for productionShipmentClient - uses header auth only

// Create separate axios instance for pincode checks (requires Authorization header)
// Pincode endpoint /c/api/pin-codes/json/ requires header: "Authorization": "Token your_token_here"
// Query param ?token= does not work reliably for this endpoint (causes 401 with generic error)
// Staging URL: https://staging-express.delhivery.com
// Response structure: { "delivery_codes": [ { "postal_code": { "pre_paid": "Y", "cod": "Y", ... } } ] }
// Test with pincode 531001 (serviceable in portal)
// If 401 persists: regenerate token from Settings > API Setup and update .env
const pincodeClient: AxiosInstance = axios.create({
  baseURL: process.env.DELHIVERY_BASE_URL || 'https://staging-express.delhivery.com',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${process.env.DELHIVERY_TOKEN}`, // exact prefix "Token "
  },
});

/**
 * Shipment object interface for Delhivery API
 */
export interface DelhiveryShipmentPayload {
  pickup_location: string;
  order_id: string;
  name: string;
  phone: string;
  address: string;
  pin: string;
  payment_mode: 'COD' | 'PREPAID';
  cod_amount?: number;
  order_items: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
  height?: number;
  breadth?: number;
  length?: number;
  weight?: number;
}

/**
 * Delhivery API response interface
 */
export interface DelhiveryResponse {
  packages: Array<{
    waybill?: string;
    AWB?: string;
    error?: string;
    rmk?: string;
  }>;
  success?: boolean;
  error?: string;
  rmk?: string;
  message?: string;
}

/**
 * Pincode serviceability response interface
 * Response structure: { "delivery_codes": [ { "postal_code": { "pre_paid": "Y", "cod": "Y", ... } } ] }
 */
export interface PincodeServiceabilityResponse {
  delivery_codes: Array<{
    postal_code: {
      pre_paid: string; // "Y" or "N"
      cod: string; // "Y" or "N"
      cash?: string; // "Y" or "N"
      pickup?: string; // "Y" or "N"
      reverse?: string; // "Y" or "N"
      district?: string;
      state?: string;
      city?: string;
    };
  }>;
}

/**
 * Checks if a pincode is serviceable by Delhivery
 * Uses Authorization header (Token) for authentication
 * 
 * @param pincode - 6-digit pincode to check
 * @returns Promise<boolean> - true if serviceable (COD or prepaid), false otherwise
 * 
 * @example
 * ```typescript
 * const isServiceable = await checkPincode("531001");
 * if (!isServiceable) {
 *   throw new Error("Pincode not serviceable");
 * }
 * ```
 * 
 * Test with pincode 531001 (serviceable in portal)
 * Check console for full pincode response
 * If 401 persists: regenerate token from Settings > API Setup and update .env
 */
export async function checkPincode(pincode: string): Promise<boolean> {
  try {
    // Token validation: if (!process.env.DELHIVERY_TOKEN) throw new Error('DELHIVERY_TOKEN missing')
    if (!process.env.DELHIVERY_TOKEN) {
      throw new Error('DELHIVERY_TOKEN missing');
    }

    // Safety check: Validate pincode format (should be exactly 6 digits)
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      console.error('[Pincode Check] Invalid pincode format:', pincode);
      return false;
    }

    // Make API call to check pincode serviceability using pincodeClient (header auth)
    // GET '/c/api/pin-codes/json/'
    // params: { filter_codes: pin }
    const response = await pincodeClient.get<PincodeServiceabilityResponse>(
      '/c/api/pin-codes/json/',
      {
        params: {
          filter_codes: pincode,
        },
      }
    );

    const data = response.data;

    // Log full response.data for debugging
    console.log('[Pincode Full Response]:', JSON.stringify(data, null, 2));

    // Parse response: return delivery_codes?.[0]?.postal_code?.pre_paid === 'Y' || delivery_codes?.[0]?.postal_code?.cod === 'Y'
    // If no delivery_codes or error → return false
    const deliveryCodes = data?.delivery_codes || [];
    
    if (deliveryCodes.length === 0) {
      console.log('[Pincode Check] No delivery_codes found for pincode:', pincode);
      return false;
    }

    const postalCode = deliveryCodes[0]?.postal_code;
    
    if (!postalCode) {
      console.log('[Pincode Check] No postal_code found in delivery_codes for pincode:', pincode);
      return false;
    }

    // Check if pincode is serviceable (COD or prepaid)
    const isServiceable = 
      postalCode.pre_paid === 'Y' || 
      postalCode.cod === 'Y';
    
    console.log('[Pincode Check] Serviceability result:', {
      pincode,
      isServiceable,
      pre_paid: postalCode.pre_paid,
      cod: postalCode.cod,
    });

    return isServiceable;
  } catch (err: unknown) {
    // On error: log full response.data even on error
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError;
      console.error('[Pincode Check] Error status:', axiosError.response?.status);
      console.error('[Pincode Check] Full response.data on error:', JSON.stringify(axiosError.response?.data, null, 2));
      console.error('[Pincode Check] Error message:', axiosError.message);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'string' ? error : String(error));
      console.error('[Pincode Check] Error:', errorMessage);
    }

    // Return false on any error (401, 400, etc.)
    return false;
  }
}

/**
 * Creates a shipment in Delhivery system
 * 
 * @param payload - Shipment data object
 * @returns Promise with Delhivery API response
 * 
 * @example
 * ```typescript
 * const response = await createShipment({
 *   pickup_location: "Main Warehouse",
 *   order_id: "ORD123",
 *   name: "John Doe",
 *   phone: "9876543210",
 *   address: "123 Main St, City, State",
 *   pin: "110001",
 *   payment_mode: "COD",
 *   cod_amount: 1000,
 *   items: [{ name: "Product 1", qty: 2, price: 500 }]
 * });
 * ```
 * 
 * Fix: Delhivery create shipment expects form-urlencoded body, not JSON
 * Fix: Delhivery production parser sometimes fails on stringified data – try direct array
 * If error persists: contact tech.admin@delhivery.com with exact rmk
 * Success ayithe AWB visible in dashboard
 * Vercel lo env vars already add cheyandi for production
 */
export async function createShipment(
  payload: DelhiveryShipmentPayload
): Promise<DelhiveryResponse> {
  try {
    // Validate required environment variables
    if (!process.env.DELHIVERY_TOKEN) {
      throw new Error('DELHIVERY_TOKEN environment variable is not set');
    }
    if (!process.env.DELHIVERY_BASE_URL) {
      throw new Error('DELHIVERY_BASE_URL environment variable is not set');
    }
    if (!process.env.DELHIVERY_WAREHOUSE_NAME) {
      throw new Error('DELHIVERY_WAREHOUSE_NAME missing in .env');
    }

    // Validate required fields
    if (!payload.pickup_location || !payload.order_id || !payload.name || !payload.phone || !payload.address || !payload.pin) {
      throw new Error('Missing required fields: pickup_location, order_id, name, phone, address, pin');
    }

    // IMPORTANT: Delhivery API expects form-urlencoded with:
    // - format=json as a top-level field
    // - data as a STRINGIFIED array of shipment objects
    const formData = new URLSearchParams();
    formData.append('format', 'json');
    formData.append('data', JSON.stringify([payload])); // Must be stringified array

    // Log the exact request being sent
    console.log('[Delhivery] Request URL:', `${process.env.DELHIVERY_BASE_URL}/api/cmu/create.json`);
    console.log('[Delhivery] Request headers:', {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Token ${process.env.DELHIVERY_TOKEN}`
    });
    console.log('[Delhivery] Request body (raw):', formData.toString());
    console.log('[Delhivery] Request body parsed - format:', formData.get('format'));
    console.log('[Delhivery] Request body parsed - data (stringified):', formData.get('data'));
    
    // Parse the data to verify it's valid JSON
    try {
      const parsedData = JSON.parse(formData.get('data') || '[]');
      console.log('[Delhivery] Request body parsed - data (parsed):', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.error('[Delhivery] Failed to parse data JSON:', e);
    }

    // Create a fresh axios instance for this request to avoid any interceptor issues
    const response = await axios.post<DelhiveryResponse>(
      `${process.env.DELHIVERY_BASE_URL}/api/cmu/create.json`,
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Authorization': `Token ${process.env.DELHIVERY_TOKEN}`
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('[Delhivery] Response received:', {
      status: response.status,
      statusText: response.statusText,
      hasPackages: !!response.data?.packages,
      packageCount: response.data?.packages?.length || 0,
    });

    // Log full response for debugging
    console.log('[Delhivery] Full response:', JSON.stringify(response.data, null, 2));

    // On success: extract waybill and log
    if (response.data?.packages && response.data.packages.length > 0) {
      const waybill = response.data.packages[0].waybill || response.data.packages[0].AWB;
      if (waybill) {
        console.log('[Delhivery Shipment Success] Waybill:', waybill);
      }
    }

    return response.data;
  } catch (error) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<DelhiveryResponse>;
      
      // Log detailed error information
      console.error('[Delhivery Error] Status:', axiosError.response?.status);
      console.error('[Delhivery Error] Status Text:', axiosError.response?.statusText);
      console.error('[Delhivery Error] Headers:', axiosError.response?.headers);
      console.error('[Delhivery Error] Full response data:', JSON.stringify(axiosError.response?.data, null, 2));
      
      // Log request config that caused the error
      console.error('[Delhivery Error] Request Config:', {
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        headers: axiosError.config?.headers,
        data: axiosError.config?.data
      });
      
      const responseData = axiosError.response?.data as DelhiveryResponse | undefined;
      const rmk = responseData?.rmk || responseData?.packages?.[0]?.rmk || '';
      const errorDetail = responseData?.error || responseData?.packages?.[0]?.error || '';
      
      console.error('[Delhivery Error] Full response.rmk:', rmk);
      console.error('[Delhivery Error] Error detail:', errorDetail);
      
      const errorMessage = 
        rmk ||
        errorDetail ||
        responseData?.message ||
        axiosError.message ||
        'Unknown error from Delhivery API';

      return {
        packages: [],
        success: false,
        error: errorMessage,
        rmk: errorMessage,
      };
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Delhivery] Error:', errorMessage);
    
    return {
      packages: [],
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Helper function to build shipment payload from order data
 * 
 * @param orderData - Order data from database
 * @returns Formatted shipment payload for Delhivery
 */
export function buildShipmentPayload(orderData: {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  pincode: string;
  payment_mode: 'COD' | 'ONLINE' | 'PREPAID';
  total: number;
  order_items: Array<{ name: string; qty: number; price: number }>;
}): DelhiveryShipmentPayload {
  const warehouseName = process.env.DELHIVERY_WAREHOUSE_NAME || 'Main Warehouse';
  
  // Convert payment mode: ONLINE/PREPAID -> PREPAID, COD -> COD
  const paymentMode: 'COD' | 'PREPAID' = 
    orderData.payment_mode === 'COD' ? 'COD' : 'PREPAID';

    return {
      pickup_location: warehouseName,
      order_id: orderData.orderId,
      name: orderData.customerName,
      phone: orderData.phone,
      address: orderData.address,
      pin: orderData.pincode,
      payment_mode: paymentMode,
      cod_amount: paymentMode === 'COD' ? orderData.total : undefined,
    
      order_items: orderData.order_items.map(item => ({
        name: item.name || 'Product',
        qty: item.qty || 1,
        price: item.price || 0,
      })),
    
      height: 10,
      breadth: 10,
      length: 10,
      weight: 0.5,
    };
  }
// ✅ ADD THIS AT BOTTOM

export async function sendOrderToDelhivery(data: any) {
  const payload = buildShipmentPayload({
    orderId: data.orderId,
    customerName: data.shippingAddress.fullName,
    phone: data.shippingAddress.phone,
    address: `${data.shippingAddress.addressLine1}, ${data.shippingAddress.city}, ${data.shippingAddress.state}`,
    pincode: data.shippingAddress.pincode,
    payment_mode: data.paymentMethod,
    total: data.totalAmount,
    order_items: data.items.map((item: any) => ({
      name: item.name,
      qty: item.quantity,
      price: item.price,
    })),
  });

  const response = await createShipment(payload);

  return {
    success: response?.packages?.length > 0,
    waybill: response?.packages?.[0]?.waybill,
    courier_name: "Delhivery",
    delivery_status: "CREATED",
    tracking_url: `https://www.delhivery.com/track/package/${response?.packages?.[0]?.waybill}`,
    rawResponse: response,
  };
};

export function logVerificationInstructions(awb: string) {
  console.log("📦 Delhivery Shipment Created");
  console.log("🔗 Track:", `https://www.delhivery.com/track/package/${awb}`);
}
