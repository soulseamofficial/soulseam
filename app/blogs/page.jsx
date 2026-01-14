
"use client";

import { useRef, useEffect, useState } from "react";

// --- Blogs reel videos data ---
// Place your 6 mp4s in public/videos/ as video1.mp4 .. video6.mp4
const blogsData = [
  {
    id: 1,
    title: "The Soul Behind The Seam",
    description: "Meet the founders and vision of SoulSeam. Dive into our creative journey.",
    videoUrl: "videos/reel1.mp4",
    thumbnail: "/videos/video1-thumb.jpg", // Add matching thumbnails to public/videos/ or replace with relevant images.
    category: "Story",
    duration: "2:05",
  },
  {
    id: 2,
    title: "Streetwear Launch Vlog",
    description: "Follow our team on launch day. Real moments, real fashion.",
    videoUrl: "videos/reel2.mp4",
    thumbnail: "/videos/video2-thumb.jpg",
    category: "Vlog",
    duration: "4:12",
  },
  {
    id: 3,
    title: "Sustainable Fabric 101",
    description: "How we choose sustainable fabrics for every piece. Quick explainer.",
    videoUrl: "videos/reel3.mp4",
    // thumbnail: "/videos/video3-thumb.jpg",
    category: "Explainer",
    duration: "1:54",
  },
  {
    id: 4,
    title: "Day in the Studio",
    description: "A behind-the-scenes look at our creative process. No filters, just flow.",
    videoUrl: "videos/reel4.mp4",
    thumbnail: "/videos/video4-thumb.jpg",
    category: "Vlog",
    duration: "3:08",
  },
  {
    id: 5,
    title: "Soulful Threads - Fall Drop",
    description: "Showcasing this season’s collection in style. Modern vibes, cool edits.",
    videoUrl: "/videos/reel5.mp4",
    thumbnail: "/videos/video5-thumb.jpg",
    category: "Story",
    duration: "2:41",
  },
  {
    id: 6,
    title: "Trend Breakdown: Oversized Tees",
    description: "Why oversized is timeless. Styling tips for the bold.",
    videoUrl: "/videos/reel6.mp4",
    thumbnail: "/videos/video6-thumb.jpg",
    category: "Explainer",
    duration: "1:19",
  },
];

// ---- VIDEO CARD (INDIVIDUAL REEL, native video only) ----
const VideoReelCard = ({ video, isActive, tabIndex = -1 }) => {
  const videoRef = useRef(null);

  // Controls native video playback based on isActive
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive, video.videoUrl]);

  return (
    <div
      className={`
        relative bg-neutral-950 rounded-3xl overflow-hidden
        shadow-xl
        aspect-[9/16]
        flex flex-col
        min-w-0
        h-full
        group
        border border-white/10
        transition-transform duration-300
        hover:scale-[1.023]
        ring-1 ring-white/5
        focus-within:ring-2 focus-within:ring-fuchsia-300
      `}
      tabIndex={tabIndex}
      aria-label={video.title}
      style={{
        fontFamily: "Inter, sans-serif",
        boxShadow: "0 5px 40px 0 rgba(0,0,0,0.38)"
      }}
    >
      {/* Only native <video> is supported */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover aspect-[9/16] bg-black rounded-3xl"
          src={video.videoUrl}
          autoPlay={isActive}
          muted
          loop
          playsInline
          poster={video.thumbnail}
          style={{
            objectFit: "cover",
            aspectRatio: "9/16",
            width: "100%",
            height: "100%",
          }}
        />
      </div>
      {/* Overlay Info */}
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 z-10">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 via-black/40 to-transparent rounded-b-3xl" />
        <div className="relative p-4 pb-6 z-10 select-text">
          <div
            className="text-white drop-shadow font-semibold text-lg md:text-xl mb-1 line-clamp-1"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {video.title}
          </div>
          <div className="flex items-center gap-2 text-gray-300 text-sm mb-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
            <span>{video.category}</span>
            <span>&bull;</span>
            <span>{video.duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- MAIN ADVANCED REEL PAGE ----
export default function BlogsPage() {
  // --- FONT LOADING ---
  useEffect(() => {
    // Dynamically inject the font links
    const interLink = document.createElement("link");
    interLink.href = "https://fonts.googleapis.com/css?family=Inter:400,500,600,700&display=swap";
    interLink.rel = "stylesheet";
    interLink.crossOrigin = "anonymous";

    const playfairLink = document.createElement("link");
    playfairLink.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap";
    playfairLink.rel = "stylesheet";
    playfairLink.crossOrigin = "anonymous";

    document.head.appendChild(interLink);
    document.head.appendChild(playfairLink);

    return () => {
      document.head.removeChild(interLink);
      document.head.removeChild(playfairLink);
    };
  }, []);

  // All videos are valid native mp4
  const validVideos = blogsData;

  // Determine per-row reel count (2 mobile, 3 desktop)
  const [perRow, setPerRow] = useState(2);

  // Used to update perRow on resize for SSR/CSR parity
  useEffect(() => {
    function checkRowCount() {
      if (typeof window === "undefined") return;
      if (window.innerWidth < 1024) {
        setPerRow(2);
      } else {
        setPerRow(3);
      }
    }
    checkRowCount();
    window.addEventListener("resize", checkRowCount);
    return () => window.removeEventListener("resize", checkRowCount);
  }, []);

  // Divide videos into rows for grid layout
  function getVideoRows(arr, perRow) {
    const rows = [];
    for (let i = 0; i < arr.length; i += perRow) {
      rows.push(arr.slice(i, i + perRow));
    }
    return rows;
  }
  const videoRows = getVideoRows(validVideos, perRow);

  // refs to all row DOM nodes for IntersectionObserver
  const rowRefs = useRef([]);
  const [rowActive, setRowActive] = useState(Array(videoRows.length).fill(false));

  // --- IntersectionObserver for Row Visibility ---
  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, videoRows.length);

    if (typeof window === "undefined" || !window.IntersectionObserver) return;

    setRowActive(Array(videoRows.length).fill(false));

    const handleEntries = (entries) => {
      let updated = [...rowActive];
      let changed = false;
      entries.forEach((entry) => {
        const idx = rowRefs.current.findIndex((ref) => ref === entry.target);
        if (idx !== -1) {
          const nowActive = entry.intersectionRatio > 0.55;
          if (updated[idx] !== nowActive) {
            updated[idx] = nowActive;
            changed = true;
          }
        }
      });
      if (changed) setRowActive(updated);
    };

    const observer = new window.IntersectionObserver(handleEntries, {
      root: null,
      threshold: [...Array(101).keys()].map((x) => x / 100),
    });
    for (let i = 0; i < videoRows.length; i++) {
      if (rowRefs.current[i]) observer.observe(rowRefs.current[i]);
    }
    return () => observer.disconnect();
  }, [videoRows.length, perRow]);

  // ---- SOULSEAM HEADER ----
  function BlogsHeader() {
    return (
      <header
        className={`
           fixed top-0 left-0 w-full z-50
            bg-transparent
            flex items-center justify-between
            px-4 md:px-10 h-16 md:h-24
        `}
        style={{
          fontFamily: "Inter, sans-serif",
          transition: "box-shadow 0.22s cubic-bezier(.4,0,.2,1)",
          boxShadow: "0 6px 34px 0 rgba(0,0,0,0.19)"
        }}>
        <div className="flex items-center gap-2 md:gap-4">
          <img src="/logo2.jpg" className="h-2 w-7 md:h-28 md:w-26 rounded-full" />
          <span
            className="text-white tracking-tight text-2xl md:text-3xl font-bold select-none"
            style={{
              fontFamily: "'Playfair Display', serif",
              letterSpacing: "0.02em"
            }}
          >
            SoulSeam
          </span>
        </div>
        <nav
          className="flex gap-6 items-center text-gray-200 font-medium text-base md:text-lg"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <a
            href="/"
            className={`
              px-2 py-0.5 rounded-lg transition-colors duration-200
              hover:text-fuchsia-300 hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300
            `}
            style={{
              fontFamily: "'Playfair Display', serif",
              letterSpacing: "0.02em"
            }}
          >
            Home
          </a>
          <a
            href="/blogs"
            className={`
              px-2 py-0.5 rounded-lg underline underline-offset-4 transition-colors duration-200
              text-cyan-200 hover:text-fuchsia-300 hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300
            `}
            style={{
              fontFamily: "'Playfair Display', serif",
              letterSpacing: "0.02em"
            }}
          >
            Blogs
          </a>
          <a
            href="/cart"
            className={`
              flex items-center gap-2 px-2 py-0.5 rounded-lg transition-colors duration-200
              hover:text-teal-300 hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300
            `}
          >
            <span className="inline-block w-5 h-5 text-gray-300">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
                <path d="M7 22a2 2 0 104 0 2 2 0 00-4 0zm0 0H4V6a2 2 0 012-2h12a2 2 0 012 2v16h-3M7 22h6"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            
            <span>Cart</span>
          </a>
        </nav>
      </header>
    );
  }

  // ----- INTRO TEXT BLOCK -----
  function BrandIntro() {
    return (
      <div
        className={`
          w-full flex flex-col items-center justify-center
          pt-24 md:pt-32 pb-4
          mb-3 md:mb-5
        `}
      >
        <div
          className={`
            max-w-2xl px-5 md:px-0
            text-center
            text-zinc-200
            font-medium
            text-lg md:text-2xl
            leading-snug
            drop-shadow
            tracking-wide
            select-none
          `}
          style={{
            fontFamily: "Inter, sans-serif",
            letterSpacing: "0.01em"
          }}
        >
          <span className="italic block text-zinc-100 font-serif" style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
            fontSize: "1.55rem"
          }}>
            Every stitch tells a story.
          </span>
          <span className="block mt-1" style={{fontWeight:"500"}}>
            Scroll through the soul of SoulSeam.
          </span>
        </div>
      </div>
    );
  }

  if (!validVideos.length) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white text-lg">
        <BlogsHeader />
        <div className="flex-1 flex items-center justify-center" style={{fontFamily: "Inter,sans-serif"}}>
          No videos available
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-white font-sans" style={{fontFamily:"Inter,sans-serif"}}>
      <BlogsHeader />
      {/* Spacing for header */}
      <div className="h-16 md:h-24" />
      <BrandIntro />
      {/* Reel grid main */}
      <main
        className={`
          w-full flex flex-col flex-1
          pb-7 md:pb-12
          bg-gradient-to-b from-black/95 via-neutral-950/95 to-black
        `}
        style={{
          overscrollBehaviorY: "contain",
        }}
      >
        {/* Advanced grid - vertical snap for rows, horizontal flex for columns */}
        <div
          className={`
            flex flex-col w-full
            overflow-y-scroll scrollbar-none no-scrollbar
            snap-y snap-mandatory
            gap-8 md:gap-14
            px-2 md:px-8
            pb-6
          `}
          style={{
            scrollSnapType: "y mandatory",
            minHeight: "calc(100vh - 8.5rem)",
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
          tabIndex={0}
        >
          {videoRows.map((row, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              ref={el => (rowRefs.current[rowIndex] = el)}
              className={`
                w-full flex items-center justify-center
                gap-5 md:gap-10
                px-0
                snap-center
                transition-shadow
                duration-300
                relative
                z-10
              `}
              style={{
                scrollSnapAlign: "center",
                height: "75vh",
                minHeight: "420px",
                maxHeight: "1000px",
                // desktop larger row height
                ...(typeof window !== "undefined" && window.innerWidth >= 1024 ?
                  { height: "80vh" } : {})
              }}
            >
              {row.map((vid, i) => (
                <div
                  key={vid.id}
                  className={`
                    flex-shrink-0 flex-grow
                    basis-0 flex flex-col h-full
                    max-w-[calc(48%)] md:max-w-[calc(31%)]
                    justify-center
                  `}
                  style={{
                    flexBasis: perRow === 2 ? "48%" : "31%",
                    // extra breathing space
                    marginLeft: i === 0 && perRow === 2 ? "1%" : "0",
                    marginRight: i === row.length - 1 && perRow === 2 ? "1%" : "0"
                  }}
                >
                  <VideoReelCard
                    video={vid}
                    isActive={rowActive[rowIndex]}
                  />
                </div>
              ))}
              {/* Fill empty columns for last row */}
              {row.length < perRow &&
                Array(perRow - row.length).fill(0).map((_, ei) => (
                  <div
                    key={"empty-" + ei}
                    className="flex-1 pointer-events-none opacity-0"
                  />
                ))}
            </div>
          ))}
        </div>
        <style>
          {`
            .scrollbar-none::-webkit-scrollbar, .no-scrollbar::-webkit-scrollbar { display: none; }
            html { background: #09090B; }
          `}
        </style>
      </main>
    </div>
  );
}