import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { getAuthUserFromCookies } from "@/app/lib/auth";
import Order from "@/app/models/Order";
import { getCloudinary } from "@/app/lib/cloudinary";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import getVideoDuration from "get-video-duration";

export async function POST(req, { params }) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const user = await getAuthUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find order and verify ownership
    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { userId: user._id },
        { guestUserId: user._id }
      ]
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if order is delivered
    if (order.orderStatus !== "DELIVERED") {
      return NextResponse.json(
        { success: false, error: "Order must be delivered before requesting exchange" },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("video");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Video file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only MP4, MOV, and WEBM are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (30 MB max)
    const maxSize = 30 * 1024 * 1024; // 30 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 30 MB limit. Maximum allowed size is 30 MB." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create temporary file for validation
    const tempPath = join(tmpdir(), `exchange-video-${orderId}-${Date.now()}.${file.name.split('.').pop()}`);
    await writeFile(tempPath, buffer);

    // Validate video duration (10-30 seconds)
    try {
      const duration = await getVideoDuration(tempPath);
      if (duration < 10) {
        await unlink(tempPath).catch(() => {});
        return NextResponse.json(
          { success: false, error: "Video duration must be at least 10 seconds. Your video is " + duration.toFixed(1) + " seconds long." },
          { status: 400 }
        );
      }
      if (duration > 30) {
        await unlink(tempPath).catch(() => {});
        return NextResponse.json(
          { success: false, error: "Video duration must not exceed 30 seconds. Your video is " + duration.toFixed(1) + " seconds long." },
          { status: 400 }
        );
      }
    } catch (durationError) {
      // Clean up temp file if duration check fails
      await unlink(tempPath).catch(() => {});
      console.error("[Exchange Video Upload] Duration validation error:", durationError);
      return NextResponse.json(
        { success: false, error: "Failed to validate video duration. Please ensure your video file is valid and in a supported format (MP4, MOV, or WEBM)." },
        { status: 400 }
      );
    }

    try {
      // Upload to Cloudinary
      const cloudinary = getCloudinary();
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          tempPath,
          {
            resource_type: "video",
            folder: "exchanges",
            public_id: `exchange-${orderId}-${Date.now()}`,
            chunk_size: 6000000, // 6MB chunks for large files
            eager: [
              { quality: "auto", format: "mp4" }
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });

      // Clean up temporary file
      await unlink(tempPath).catch(() => {});

      return NextResponse.json({
        success: true,
        videoUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      });
    } catch (uploadError) {
      // Clean up temporary file on error
      await unlink(tempPath).catch(() => {});
      console.error("[Exchange Video Upload] Cloudinary error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload video. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Exchange Video Upload] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process video upload" },
      { status: 500 }
    );
  }
}
