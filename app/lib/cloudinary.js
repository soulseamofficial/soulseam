import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary Configuration Utility
 * 
 * Best Practice: Uses CLOUDINARY_URL if available (single env var)
 * Falls back to individual variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * 
 * Configuration is done lazily (on first use) to ensure env vars are loaded
 */

let isConfigured = false;

/**
 * Configures Cloudinary with credentials from environment variables
 * This function is idempotent - safe to call multiple times
 * 
 * @throws {Error} If Cloudinary credentials are missing or invalid
 */
export function configureCloudinary() {
  // If already configured, skip
  if (isConfigured) {
    return;
  }

  // Prefer CLOUDINARY_URL (single environment variable approach)
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    // Validate CLOUDINARY_URL format
    if (
      !cloudinaryUrl.startsWith("cloudinary://") ||
      cloudinaryUrl === "cloudinary://your_api_key:your_api_secret@your_cloud_name" ||
      cloudinaryUrl.includes("your_")
    ) {
      throw new Error(
        `❌ Cloudinary configuration error: Invalid or placeholder CLOUDINARY_URL detected.\n` +
        `Please set a valid CLOUDINARY_URL in your .env.local file.\n` +
        `Format: cloudinary://api_key:api_secret@cloud_name\n` +
        `After updating, restart your Next.js development server.`
      );
    }

    // Cloudinary SDK automatically reads CLOUDINARY_URL from process.env
    // We just need to ensure secure is enabled
    cloudinary.config({
      secure: true, // Always use HTTPS
    });
    isConfigured = true;
    return;
  }

  // Fallback to individual environment variables
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Validate all required credentials are present
  if (!cloudName || !apiKey || !apiSecret) {
    const missing = [];
    if (!cloudName) missing.push("CLOUDINARY_CLOUD_NAME");
    if (!apiKey) missing.push("CLOUDINARY_API_KEY");
    if (!apiSecret) missing.push("CLOUDINARY_API_SECRET");

    throw new Error(
      `❌ Cloudinary configuration error: Missing required environment variables.\n` +
      `Missing: ${missing.join(", ")}\n\n` +
      `Please add to your .env.local file:\n` +
      `Option 1 (Recommended): CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name\n` +
      `Option 2: CLOUDINARY_CLOUD_NAME=your_cloud_name\n` +
      `         CLOUDINARY_API_KEY=your_api_key\n` +
      `         CLOUDINARY_API_SECRET=your_api_secret\n\n` +
      `After adding, restart your Next.js development server.`
    );
  }

  // Check for placeholder values
  if (
    cloudName === "your_cloudinary_cloud_name" ||
    apiKey === "your_cloudinary_api_key" ||
    apiSecret === "your_cloudinary_api_secret" ||
    cloudName.includes("your_") ||
    apiKey.includes("your_") ||
    apiSecret.includes("your_")
  ) {
    throw new Error(
      `❌ Cloudinary configuration error: Placeholder values detected in environment variables.\n` +
      `Please replace placeholder values with your actual Cloudinary credentials in .env.local\n` +
      `After updating, restart your Next.js development server.`
    );
  }

  // Configure Cloudinary with individual variables
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true, // Always use HTTPS
  });

  isConfigured = true;
}

/**
 * Get configured Cloudinary instance
 * Automatically configures if not already configured
 * 
 * @returns {object} Configured Cloudinary v2 instance
 */
export function getCloudinary() {
  configureCloudinary();
  return cloudinary;
}

// Export the cloudinary instance for direct use (will auto-configure on first use)
export { cloudinary };
