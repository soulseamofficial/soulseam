export const dynamic = "force-dynamic";

import { connectDB } from "../lib/db";
import Reel from "../models/Reel";
import BlogCard from "../components/BlogCard";
import BlogsClient from "../components/BlogsClient";

// Server component to fetch and display blogs (reels)
export default async function BlogsPage() {
  let blogs = [];

  try {
    await connectDB();
    const reels = await Reel.find().sort({ createdAt: -1 }).lean();
    // Convert ObjectId to string for serialization
    blogs = reels.map((reel) => ({
      ...reel,
      _id: reel._id.toString(),
    }));
  } catch (err) {
    console.error("Error fetching blogs:", err);
    blogs = [];
  }

  return <BlogsClient blogs={blogs} />;
}