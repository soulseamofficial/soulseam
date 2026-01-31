import { connectDB } from "../lib/db";
import Reel from "../models/Reel";

// Format date helper
function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Section */}
      <div className="border-b border-white/10 bg-gradient-to-b from-black via-black to-black/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-transparent">
            Blogs
          </h1>
          <p className="text-white/60 text-lg sm:text-xl max-w-2xl">
            Discover our latest content and stories
          </p>
        </div>
      </div>

      {/* Blogs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        {blogs.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-white/60 text-lg mb-4">No blogs available yet.</p>
            <p className="text-white/40 text-sm">Check back soon for new content!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {blogs.map((blog) => (
              <article
                key={blog._id.toString()}
                className="
                  group relative overflow-hidden
                  rounded-3xl
                  bg-gradient-to-b from-white/8 via-black/25 to-black
                  backdrop-blur-xl
                  border border-white/12
                  transition-all duration-300
                  hover:scale-[1.02]
                  hover:shadow-[0_10px_45px_rgba(255,255,255,0.18)]
                  hover:border-white/20
                "
              >
                {/* Top glow effect */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.14)_0%,_rgba(0,0,0,0.9)_55%)]" />

                <div className="relative z-10">
                  {/* Video/Media */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-t-3xl bg-black">
                    {blog.videoUrl ? (
                      <video
                        src={blog.videoUrl}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        playsInline
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <svg
                          className="w-16 h-16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Category Badge */}
                    {blog.category && (
                      <div className="inline-block">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/10 text-white/80 border border-white/20">
                          {blog.category}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl font-bold text-white line-clamp-2 group-hover:text-white/90 transition-colors">
                      {blog.title || "Untitled Blog"}
                    </h2>

                    {/* Duration */}
                    {blog.duration && (
                      <p className="text-sm text-white/60 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {blog.duration}
                      </p>
                    )}

                    {/* Date */}
                    {blog.createdAt && (
                      <p className="text-xs text-white/50">
                        {formatDate(blog.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
