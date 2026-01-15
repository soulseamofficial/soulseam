"use client";

import { useRef, useEffect, useState } from "react";

/* ================= DATA ================= */

const blogsData = [
  { id: 1, title: "The Soul Behind The Seam", videoUrl: "/videos/reel1.mp4", category: "Story", duration: "2:05" },
  { id: 2, title: "Streetwear Launch Vlog", videoUrl: "/videos/reel2.mp4", category: "Vlog", duration: "4:12" },
  { id: 3, title: "Sustainable Fabric 101", videoUrl: "/videos/reel3.mp4", category: "Explainer", duration: "1:54" },
  { id: 4, title: "Day in the Studio", videoUrl: "/videos/reel4.mp4", category: "Vlog", duration: "3:08" },
  { id: 5, title: "Fall Drop Lookbook", videoUrl: "/videos/reel5.mp4", category: "Story", duration: "2:41" },
  { id: 6, title: "Oversized Tee Breakdown", videoUrl: "/videos/reel6.mp4", category: "Explainer", duration: "1:19" },
];

/* ================= REEL CARD ================= */

const ReelCard = ({ video, highlight = false }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.play().catch(() => {});
    }
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-[26px] bg-black transition-all duration-500"
      style={{
        aspectRatio: "9 / 16",
        transform: highlight ? "scale(1.05)" : "scale(1)",
        boxShadow: highlight
          ? "0 40px 90px rgba(0,0,0,.75)"
          : "0 20px 50px rgba(0,0,0,.45)",
      }}
    >
      <video
        ref={ref}
        src={video.videoUrl}
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      <div className="absolute bottom-0 p-4">
        <p className="text-xs uppercase tracking-widest text-white/60">
          {video.category} • {video.duration}
        </p>
        <h3 className="text-lg font-semibold text-white mt-1">
          {video.title}
        </h3>
      </div>
    </div>
  );
};

/* ================= PAGE ================= */

export default function BlogsPage() {
  const [isDesktop, setIsDesktop] = useState(false);

  /* Detect desktop vs mobile */
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ================= MOBILE LAYOUT ================= */

  const containerRef = useRef(null);
  const [centerIndex, setCenterIndex] = useState(1);

  useEffect(() => {
    if (isDesktop) return;

    const container = containerRef.current;
    if (!container) return;

    const handler = () => {
      const cards = Array.from(container.children);
      const centerX = window.innerWidth / 2;

      let closestIndex = 0;
      let minDistance = Infinity;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.abs(centerX - cardCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      setCenterIndex(closestIndex);
    };

    handler();
    container.addEventListener("scroll", handler);
    window.addEventListener("resize", handler);

    return () => {
      container.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [isDesktop]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-black/70 backdrop-blur px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo2.jpg" className="h-10 w-10 rounded-full" />
          <span className="text-2xl font-semibold">SoulSeam</span>
        </div>
        <nav className="flex gap-6 text-sm text-white/80">
          <a href="/">Home</a>
          <a href="/blogs" className="underline underline-offset-4">Blogs</a>
          <a href="/cart">Cart</a>
        </nav>
      </header>

      <div className="h-20" />

      {/* INTRO */}
      <section className="text-center py-10 px-4">
        <h1 className="text-3xl sm:text-4xl italic font-light">
          Every stitch tells a story.
        </h1>
        <p className="text-white/60 mt-2">
          Scroll through the soul of SoulSeam.
        </p>
      </section>

      {/* ================= MOBILE VIEW ================= */}
      {!isDesktop && (
        <section className="pb-24">
          <div
            ref={containerRef}
            className="flex gap-8 overflow-x-auto px-6 scrollbar-hide"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {blogsData.map((video, index) => (
              <div
                key={video.id}
                className="flex-shrink-0"
                style={{ width: "70vw", maxWidth: "360px" }}
              >
                <ReelCard
                  video={video}
                  highlight={index === centerIndex}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= DESKTOP VIEW ================= */}
      {isDesktop && (
        <section className="max-w-7xl mx-auto px-12 pb-24">
          <div className="grid grid-cols-3 gap-12">
            {blogsData.map((video) => (
              <ReelCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
