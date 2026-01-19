export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import path from "path";
import fs from "fs/promises";
import Reel from "../../../models/Reel";

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
}

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

    // Duplicate check
    const existing = await Reel.findOne({ title: title.trim() });
    if (existing) {
      return NextResponse.json(
        { message: "Reel already exists" },
        { status: 409 }
      );
    }

    // uploads folder
    const uploadDir = path.join(process.cwd(), "public/uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // save file
    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${video.name}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const videoUrl = `/uploads/${fileName}`;

    const reel = await Reel.create({
      title: title.trim(),
      category,
      duration,
      videoUrl,
    });

    return NextResponse.json({ success: true, reel });

  } catch (err) {
    console.error("REEL UPLOAD ERROR:", err);
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