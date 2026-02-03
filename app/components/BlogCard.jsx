"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function BlogCard({ blog, index, isHero = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const videoRef = useRef(null);

  // Check if device is desktop (supports hover)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsDesktop(mediaQuery.matches);
    
    const handleChange = (e) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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

  // Handle video hover autoplay (desktop only)
  useEffect(() => {
    if (!videoRef.current || !isDesktop) return;
    
    const video = videoRef.current;
    
    if (isHovered && !isPlaying) {
      video.muted = false; // Unmute for audio
      video.play().catch(() => {
        // Autoplay failed, show play button
      });
      setIsPlaying(true);
    } else if (!isHovered && isPlaying) {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isHovered, isPlaying, isDesktop]);

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 60,
      scale: 0.96
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`
        group relative overflow-hidden
        rounded-[24px]
        bg-gradient-to-b from-white/[0.08] via-black/40 to-black/90
        backdrop-blur-2xl
        border border-white/[0.12]
        transition-all duration-700 ease-out
        cursor-pointer
        w-full h-full
        ${isHero ? 'aspect-[4/5] md:aspect-[3/4] min-h-[400px] md:min-h-[500px]' : 'aspect-[4/5] min-h-[350px] md:min-h-[400px]'}
      `}
      onMouseEnter={() => {
        if (isDesktop) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (!isDesktop && videoRef.current) {
          const video = videoRef.current;
          if (isPlaying) {
            video.pause();
            setIsPlaying(false);
          } else {
            video.muted = false; // Unmute for audio
            video.play().catch(() => {
              // Play failed
            });
            setIsPlaying(true);
          }
        }
      }}
      whileHover={{ 
        y: -8,
        scale: 1.01,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
      }}
      style={{
        boxShadow: isHovered 
          ? '0 20px 60px rgba(255, 255, 255, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.2)' 
          : '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.12)'
      }}
    >
      {/* Grain/Noise Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none z-[5]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top Glow Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.15)_0%,_transparent_60%)] z-[2]" />

      {/* Video/Media Container */}
      <div className="relative w-full h-full overflow-hidden">
        {blog.videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={blog.videoUrl}
              className="w-full h-full object-cover transition-transform duration-700"
              loop
              playsInline
              preload="metadata"
              style={{
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              }}
            />
            
            {/* Video Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-[3]" />
            
            {/* Play Button Indicator (when not playing or on mobile) */}
            {(!isPlaying || !isDesktop) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: isHovered && isDesktop ? 0 : 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center z-[4] pointer-events-none"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-0 h-0 border-l-[14px] sm:border-l-[16px] border-l-white border-t-[10px] sm:border-t-[12px] border-t-transparent border-b-[10px] sm:border-b-[12px] border-b-transparent ml-1"
                  />
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
            <svg
              className="w-16 h-16 text-white/20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 z-[4]">
          {/* Category Badge */}
          {blog.category && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: isHovered ? 1 : 0.9, 
                x: 0 
              }}
              transition={{ duration: 0.4 }}
              className="mb-4"
            >
              <span className="px-4 py-1.5 text-xs font-semibold tracking-wider uppercase rounded-full bg-white/10 backdrop-blur-md text-white/90 border border-white/20">
                {blog.category}
              </span>
            </motion.div>
          )}

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: isHovered ? 1.02 : 1
            }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight tracking-tight"
            style={{
              textShadow: '0 2px 20px rgba(0, 0, 0, 0.8)'
            }}
          >
            {blog.title || "Untitled Story"}
          </motion.h2>

          {/* Meta Information */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-4 text-sm text-white/70"
          >
            {blog.duration && (
              <div className="flex items-center gap-1.5">
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
                <span className="font-medium">{blog.duration}</span>
              </div>
            )}

            {blog.createdAt && (
              <span className="text-white/60 font-light">
                {formatDate(blog.createdAt)}
              </span>
            )}
          </motion.div>
        </div>
      </div>

      {/* Border Glow on Hover */}
      <motion.div
        className="absolute inset-0 rounded-[24px] pointer-events-none z-[1]"
        animate={{
          boxShadow: isHovered
            ? '0 0 0 1px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1)'
            : '0 0 0 1px rgba(255, 255, 255, 0.12)'
        }}
        transition={{ duration: 0.5 }}
      />
    </motion.article>
  );
}