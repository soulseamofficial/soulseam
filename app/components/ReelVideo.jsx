"use client";

import { useState, useRef, useEffect } from "react";

/**
 * Premium Reel Video Component
 * 
 * Features:
 * - Strict 9:16 vertical aspect ratio
 * - Premium SoulSeam dark luxury theme
 * - Lazy loading with Intersection Observer
 * - Auto-play on hover (desktop) / tap (mobile)
 * - Premium glow effects
 * - No stretch, no black spaces
 */
export default function ReelVideo({
  videoUrl,
  posterUrl,
  isHovered = false,
  autoPlay = false,
  className = "",
  onVideoClick,
  children, // For overlay content (badge, title, etc.)
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Detect desktop device
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

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;

    // Store ref value in local variable to prevent stale ref warning
    const containerElement = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before visible
        threshold: 0.1,
      }
    );

    observer.observe(containerElement);

    return () => {
      if (containerElement) {
        observer.unobserve(containerElement);
      }
    };
  }, []);

  // Handle video hover autoplay (desktop only)
  useEffect(() => {
    if (!videoRef.current || !isDesktop || !isVisible) return;
    
    const video = videoRef.current;
    
    if (isHovered && !isPlaying && autoPlay) {
      video.muted = false;
      video.play().catch(() => {
        // Autoplay failed, keep muted
        video.muted = true;
        video.play().catch(() => {});
      });
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setIsPlaying(true);
      }, 0);
    } else if (!isHovered && isPlaying) {
      video.pause();
      video.currentTime = 0;
      setTimeout(() => {
        setIsPlaying(false);
      }, 0);
    }
  }, [isHovered, isPlaying, isDesktop, autoPlay, isVisible]);

  // Handle video loaded
  const handleLoadedData = () => {
    setIsLoaded(true);
  };

  // Handle click (mobile)
  const handleClick = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.muted = false;
      video.play().catch(() => {
        // Fallback to muted
        video.muted = true;
        video.play().catch(() => {});
      });
      setIsPlaying(true);
    }
    
    if (onVideoClick) {
      onVideoClick();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`
        reel-video-container
        relative
        w-full
        max-w-[320px]
        mx-auto
        bg-black
        rounded-[28px]
        overflow-hidden
        ${className}
      `}
      style={{
        aspectRatio: '9 / 16',
        position: 'relative',
      }}
    >
      {/* Background Halo Glow Effect */}
      <div 
        className="absolute inset-0 -z-10 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Video Wrapper */}
      <div className="relative w-full h-full overflow-hidden">
        {videoUrl && isVisible ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              className="w-full h-full object-cover"
              loop
              playsInline
              preload="metadata"
              muted
              onLoadedData={handleLoadedData}
              onClick={handleClick}
              style={{
                transition: 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              }}
            />
            
            {/* Dark gradient overlay at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-[2]" />
            
            {/* Play Button Indicator (when not playing or on mobile) */}
            {(!isPlaying || !isDesktop) && (
              <div
                className="absolute inset-0 flex items-center justify-center z-[3] pointer-events-none transition-opacity duration-200"
                style={{
                  opacity: isHovered && isDesktop ? 0 : 1,
                }}
              >
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-0.5" />
                </div>
              </div>
            )}

            {/* Loading shimmer */}
            {!isLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-shimmer z-[1]" />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
            <svg
              className="w-12 h-12 text-white/20"
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

        {/* Overlay Content (badge, title, etc.) */}
        {children && (
          <div className="absolute inset-0 flex flex-col justify-end p-5 z-[3] pointer-events-none">
            {children}
          </div>
        )}
      </div>

      {/* Premium Glow Border (animated on hover) */}
      <div 
        className="absolute inset-0 rounded-[28px] pointer-events-none transition-opacity duration-500"
        style={{
          boxShadow: `
            0 0 20px rgba(59, 130, 246, 0.3),
            0 0 40px rgba(59, 130, 246, 0.2),
            0 0 60px rgba(59, 130, 246, 0.1),
            inset 0 0 20px rgba(255, 255, 255, 0.05)
          `,
          opacity: isHovered ? 1 : 0,
        }}
      />
    </div>
  );
}
