"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import BlogCard from "./BlogCard";

export default function BlogsClient({ blogs }) {
  const dividerRef = useRef(null);

  useEffect(() => {
    // Animate divider line on mount
    if (dividerRef.current) {
      const timer = setTimeout(() => {
        dividerRef.current.style.width = "100%";
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const heroBlog = blogs.length > 0 ? blogs[0] : null;
  const secondaryBlogs = blogs.slice(1);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Grain/Noise Overlay for Cinematic Texture */}
      <div 
        className="fixed inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none z-[100]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      {/* Subtle Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-zinc-950 to-black pointer-events-none z-0" />

      {/* Hero Section */}
      <section className="relative z-10 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 sm:py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-6"
          >
            {/* Main Heading */}
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-none"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.02em'
              }}
            >
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                Stories from
              </span>
              <br />
              <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                SoulSeam
              </span>
            </h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/50 font-light max-w-2xl leading-relaxed"
              style={{ letterSpacing: '0.01em' }}
            >
              Discover our latest narratives, visual journeys, and brand stories
            </motion.p>

            {/* Animated Divider Line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="pt-8"
            >
              <div className="relative h-px bg-gradient-to-r from-white/20 via-white/40 to-transparent overflow-hidden">
                <motion.div
                  ref={dividerRef}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.2, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="h-full bg-gradient-to-r from-white/60 via-white to-white/60"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Blogs Grid Section */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-12 md:py-16 lg:py-20">
          {blogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center py-24 sm:py-32"
            >
              <p className="text-white/60 text-lg sm:text-xl mb-4 font-light">No stories available yet.</p>
              <p className="text-white/40 text-sm sm:text-base">Check back soon for new content.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-6 lg:gap-8 auto-rows-max">
              {/* Hero Blog Card (First, larger - spans 2 columns and 2 rows on desktop) */}
              {heroBlog && (
                <div className="md:col-span-2 md:row-span-2">
                  <BlogCard blog={heroBlog} index={0} isHero={true} />
                </div>
              )}

              {/* Secondary Blog Cards with varied sizes for masonry effect */}
              {secondaryBlogs.map((blog, index) => {
                // Create varied card sizes for visual interest (only on desktop)
                const cardSize = 
                  index % 5 === 0 ? "md:row-span-2" : 
                  index % 7 === 0 ? "md:col-span-2" : 
                  "";
                
                return (
                  <div key={blog._id} className={cardSize}>
                    <BlogCard 
                      blog={blog} 
                      index={index + 1}
                      isHero={false}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Spacing */}
      <div className="h-32" />
    </div>
  );
}