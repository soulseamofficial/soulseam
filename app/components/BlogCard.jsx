"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ReelVideo from "./ReelVideo";

export default function BlogCard({ blog, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if device is desktop (supports hover)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    // Use setTimeout to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      setIsDesktop(mediaQuery.matches);
    }, 0);
    
    const handleChange = (e) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', handleChange);
    };
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

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 40
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group reel-card-wrapper"
      onMouseEnter={() => {
        if (isDesktop) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transition: 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transform: isHovered ? 'translateY(-8px) scale(1.05)' : 'translateY(0) scale(1)',
      }}
    >
      <ReelVideo
        videoUrl={blog.videoUrl}
        isHovered={isHovered}
        autoPlay={true}
        className="reel-card"
      >
        {/* Category Badge */}
        {blog.category && (
          <div className="mb-3 pointer-events-auto">
            <span className="inline-block px-3 py-1 text-[10px] font-medium tracking-wider uppercase rounded-full bg-white/10 backdrop-blur-sm text-white/90 border border-white/20">
              {blog.category}
            </span>
          </div>
        )}

        {/* Title - Max 2 lines */}
        <h2
          className="text-lg font-semibold text-white mb-2 leading-tight line-clamp-2 pointer-events-auto"
          style={{
            transition: 'color 220ms ease',
            color: isHovered ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
            textShadow: '0 1px 8px rgba(0, 0, 0, 0.6)'
          }}
        >
          {blog.title || "Untitled Story"}
        </h2>

        {/* Meta Information - Smaller, muted */}
        <div 
          className="flex items-center gap-3 text-xs text-white/60 pointer-events-auto"
          style={{
            transition: 'color 220ms ease',
            color: isHovered ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.6)'
          }}
        >
          {blog.duration && (
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5"
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
              <span>{blog.duration}</span>
            </div>
          )}

          {blog.createdAt && (
            <span>
              {formatDate(blog.createdAt)}
            </span>
          )}
        </div>
      </ReelVideo>
    </motion.div>
  );
}