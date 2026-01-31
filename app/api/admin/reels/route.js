export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Reel from "../../../models/Reel";
import { getCloudinary } from "@/app/lib/cloudinary";
import { requireAdminAuth } from "@/app/lib/adminAuth";

export async function POST(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const formData = await req.formData();

    const video = formData.get("video");
    const title = formData.get("title");
    const category = formData.get("category");
    const duration = formData.get("duration");

    if (!video || !title || !category || !duration) {
      return NextResponse.json(
        { message: "Missing fields" },
        { status: 400 }
      );
    }

    // Duplicate check
    const existing = await Reel.findOne({ title: title.trim() });
    if (existing) {
      return NextResponse.json(
        { message: "Reel already exists" },
        { status: 409 }
      );
    }

    /* 🔥 VIDEO UPLOAD TO CLOUDINARY */
    const cloudinary = getCloudinary();

    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "soulseam/reels",
            resource_type: "video",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    // Safety check: ensure secure_url exists
    if (!uploadResult?.secure_url) {
      throw new Error("Cloudinary upload failed: secure_url not returned");
    }

    /* 🔥 SAVE REEL */
    const reel = await Reel.create({
      title: title.trim(),
      category,
      duration,
      videoUrl: uploadResult.secure_url, // ✅ Cloudinary URL - stored directly, no manipulation
    });

    console.log(`[Admin Reels] Reel created: ${reel.title} (ID: ${reel._id})`);
    return NextResponse.json({ success: true, reel });

  } catch (err) {
    console.error("[Admin Reels] POST error:", err);
    return NextResponse.json(
      { message: "Upload failed" },
      { status: 500 }
    );
  }
}

/* -------- GET ALL REELS -------- */
export async function GET() {
  try {
    await connectDB();
    const reels = await Reel.find().sort({ createdAt: -1 });
    return NextResponse.json(reels);
  } catch (err) {
    return NextResponse.json([], { status: 500 });
  }
}

/* -------- DELETE REEL -------- */
export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await Reel.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}