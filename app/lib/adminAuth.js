import { connectDB } from "./db";
import Admin from "../models/Admin";

/**
 * Get admin token from cookies in API routes
 * Works with Next.js App Router API route requests
 */
export async function getAdminToken(req) {
  if (!req) return null;
  
  // Try from request cookies (Next.js App Router)
  const token = req.cookies?.get("admin_token")?.value;
  if (token) return token;
  
  // Fallback: try from headers (for compatibility)
  const cookieHeader = req.headers?.get?.("cookie");
  if (cookieHeader) {
    const matches = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]*)/);
    if (matches?.[1]) return matches[1];
  }
  
  return null;
}

/**
 * Verify admin token and return admin document
 * Returns null if invalid or admin doesn't exist
 */
export async function verifyAdminToken(token) {
  if (!token) return null;
  
  try {
    await connectDB();
    const admin = await Admin.findById(token);
    if (!admin) {
      console.warn(`[Admin Auth] Invalid admin token: ${token}`);
    }
    return admin;
  } catch (err) {
    console.error("[Admin Auth] Token verification error:", err);
    return null;
  }
}

/**
 * Middleware helper: Check if request is authenticated as admin
 * Returns { authorized: boolean, admin: Admin | null, error: string | null }
 */
export async function requireAdminAuth(req) {
  const token = await getAdminToken(req);
  
  if (!token) {
    console.warn("[Admin Auth] Request missing admin token");
    return {
      authorized: false,
      admin: null,
      error: "Unauthorized - No admin token"
    };
  }
  
  const admin = await verifyAdminToken(token);
  
  if (!admin) {
    console.warn("[Admin Auth] Invalid or expired admin token");
    return {
      authorized: false,
      admin: null,
      error: "Unauthorized - Invalid admin token"
    };
  }
  
  return {
    authorized: true,
    admin,
    error: null
  };
}
