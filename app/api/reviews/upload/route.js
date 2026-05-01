import { NextResponse } from "next/server";
import { getCloudinaryReview } from "@/app/lib/cloudinaryReview";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_IMAGES = 4;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("images");
    const productId = formData.get("productId");

    // Validate images are provided
    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: "At least one image is required" },
        { status: 400 }
      );
    }

    // Validate maximum number of images
    if (files.length > MAX_IMAGES) {
      return NextResponse.json(
        { message: "Maximum 4 images allowed" },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Validate all files
    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPEG, PNG, and WEBP are allowed." },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File size exceeds 2MB limit" },
          { status: 400 }
        );
      }
    }

    // Get review Cloudinary instance
    const cloudinary = getCloudinaryReview();

    // Upload all images in parallel using Promise.all
    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "reviews",
              resource_type: "image",
              transformation: [
                { quality: "auto", fetch_format: "auto" },
                { width: 1200, height: 1200, crop: "limit" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });
    });

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);

    // Extract secure URLs from all results
    const imageUrls = uploadResults.map((result) => {
      if (!result?.secure_url) {
        throw new Error("Cloudinary upload failed: secure_url not returned");
      }
      return result.secure_url;
    });

    return NextResponse.json({
      success: true,
      imageUrls: imageUrls,
    });
  } catch (error) {
    console.error("[Review Upload] Error:", error);
    return NextResponse.json(
      { error: "Failed to upload images", details: error.message },
      { status: 500 }
    );
  }
}
