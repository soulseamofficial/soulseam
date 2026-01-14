import { NextResponse } from "next/server";
import mongoose from "mongoose";
import path from "path";
import fs from "fs/promises";
import Reel from "../../models/Reel.js";

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
}

// ---------------- POST ----------------
export async function POST(req) {
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

    // 🔴 Duplicate check
    const existing = await Reel.findOne({ title: title.trim() });
    if (existing) {
      return NextResponse.json(
        { message: "Reel already exists" },
        { status: 409 }
      );
    }

    // 📁 Create uploads folder
    const uploadDir = path.join(process.cwd(), "public/uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // 💾 Save video file
    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${video.name}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const videoUrl = `/uploads/${fileName}`;

    // 🟢 Save to MongoDB
    const reel = await Reel.create({
      title: title.trim(),
      category,
      duration,
      videoUrl
    });

    return NextResponse.json({ success: true, reel });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json(
      { message: "Upload failed" },
      { status: 500 }
    );
  }
}
