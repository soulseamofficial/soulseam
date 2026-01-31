import { connectDB } from "../../lib/db";
import Reel from "../../models/Reel";

// ✅ PUBLIC BLOGS API (USER SIDE) - Fetches reels data
export async function GET() {
  try {
    await connectDB();

    const reels = await Reel.find().sort({ createdAt: -1 });

    // Format reels for public display
    const formattedBlogs = reels.map((reel) => ({
      _id: reel._id,
      title: reel.title,
      category: reel.category,
      duration: reel.duration,
      videoUrl: reel.videoUrl,
      createdAt: reel.createdAt,
    }));

    return Response.json(formattedBlogs, { status: 200 });

  } catch (err) {
    console.error("PUBLIC BLOGS API ERROR:", err);
    return Response.json([], { status: 500 });
  }
}
