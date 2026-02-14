"use client";

import { useState, useEffect, useRef } from "react";

// Message templates with placeholders
const messageTemplates = [
  { template: "{count} members purchased this in the last hour", type: "purchased", range: [3, 12] },
  { template: "{count} people are viewing this right now", type: "viewing", range: [90, 220] },
  { template: "Only {count} pieces left in stock", type: "stock", range: [5, 15] },
  { template: "{count} orders placed today", type: "orders", range: [10, 40] },
];

// Animated number component with count-up effect and luxury animations
function AnimatedNumber({ value, previousValue }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== previousValue && previousValue !== null && previousValue !== undefined) {
      setIsAnimating(true);
      const duration = 600; // 600ms smooth animation
      const startValue = previousValue;
      const endValue = value;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-in-out for luxury feel)
        const easeInOut = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        const currentValue = Math.round(startValue + (endValue - startValue) * easeInOut);
        
        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayValue(value);
    }
  }, [value, previousValue]);

  return (
    <span
      className={`inline-block transition-all duration-500 ease-in-out ${
        isAnimating ? "scale-[1.03]" : "scale-100"
      }`}
      style={{
        color: "#D4AF37", // Royal gold
        fontWeight: 600,
        textShadow: isAnimating 
          ? "0 0 24px rgba(212, 175, 55, 0.6), 0 0 12px rgba(212, 175, 55, 0.4)"
          : "0 0 16px rgba(212, 175, 55, 0.4)",
        transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), text-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {displayValue}
    </span>
  );
}

// Pulse dot for "viewing now" indicator - soft green pulse
function PulseDot() {
  return (
    <span className="relative inline-flex items-center ml-2">
      <span
        className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400/60 opacity-75"
        style={{
          animation: "social-proof-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        }}
      ></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400/80"></span>
    </span>
  );
}

export default function SocialProof() {
  const [currentMessage, setCurrentMessage] = useState(null);
  const [currentCount, setCurrentCount] = useState(null);
  const [previousCount, setPreviousCount] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef(null);
  const messageIndexRef = useRef(0);
  const countRef = useRef(null);

  // Generate random number within range
  const generateRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Initialize and rotate messages
  useEffect(() => {
    // Initial message
    const initialTemplate = messageTemplates[0];
    const initialCount = generateRandomNumber(...initialTemplate.range);
    setCurrentMessage(initialTemplate);
    setCurrentCount(initialCount);
    countRef.current = initialCount;
    setIsVisible(true);

    // Rotate messages every 8-12 seconds
    const rotateMessage = () => {
      const currentCountValue = countRef.current;
      setPreviousCount(currentCountValue);
      
      // Fade out
      setIsVisible(false);
      
      setTimeout(() => {
        // Get next message
        messageIndexRef.current = (messageIndexRef.current + 1) % messageTemplates.length;
        const nextTemplate = messageTemplates[messageIndexRef.current];
        const nextCount = generateRandomNumber(...nextTemplate.range);
        
        setCurrentMessage(nextTemplate);
        setCurrentCount(nextCount);
        countRef.current = nextCount;
        
        // Fade in
        setTimeout(() => setIsVisible(true), 50);
      }, 300); // Fade out duration
    };

    // Random interval between 8-12 seconds
    const scheduleNext = () => {
      const delay = Math.random() * 4000 + 8000; // 8000-12000ms
      intervalRef.current = setTimeout(() => {
        rotateMessage();
        scheduleNext(); // Schedule next rotation
      }, delay);
    };

    scheduleNext();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  if (!currentMessage) return null;

  // Split message to insert animated number
  const parts = currentMessage.template.split("{count}");

  return (
    <div
      className={`
        relative w-full max-w-sm md:max-w-md mx-auto
        rounded-xl px-5 py-3.5 md:px-6 md:py-4
        bg-gradient-to-b from-white/10 via-black/30 to-black/60
        backdrop-blur-xl
        border border-white/15
        shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08)]
        transition-all duration-500 ease-in-out
        will-change-transform
        group/social-proof
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
      style={{
        transition: "opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.6s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Inner glow overlay - luxury glassmorphism */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12)_0%,_rgba(0,0,0,0.85)_70%)] rounded-xl"></div>
      
      {/* Subtle border glow - always visible, intensifies on parent hover */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-500"
        style={{
          boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.15), 0 0 20px rgba(255, 255, 255, 0.08), inset 0 0 20px rgba(255, 255, 255, 0.03)",
          opacity: 1,
        }}
      ></div>

      {/* Enhanced glow on parent image hover */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-500 opacity-0 group-hover/image-container:opacity-100 group-hover:opacity-100"
        style={{
          boxShadow: "0 0 0 1px rgba(212, 175, 55, 0.25), 0 0 30px rgba(212, 175, 55, 0.15), 0 0 60px rgba(212, 175, 55, 0.08)",
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        <p className="text-white/95 text-xs md:text-sm font-medium tracking-wide text-center leading-relaxed">
          {parts[0]}
          <AnimatedNumber value={currentCount} previousValue={previousCount} />
          {parts[1]}
          {currentMessage.type === "viewing" && <PulseDot />}
        </p>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes social-proof-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        /* Lift effect when parent image container is hovered (mobile) */
        .group\\/image-container:hover .group\\/social-proof {
          transform: translateY(-6px) !important;
          box-shadow: 0_12px_48px_rgba(0,0,0,0.5), 0_0_0_1px_rgba(255,255,255,0.15), 0_0_40px_rgba(255,255,255,0.12) !important;
        }
        
        /* Desktop: lift when product image group is hovered */
        .group:hover .group\\/social-proof {
          transform: translateY(-6px) !important;
          box-shadow: 0_12px_48px_rgba(0,0,0,0.5), 0_0_0_1px_rgba(255,255,255,0.15), 0_0_40px_rgba(255,255,255,0.12) !important;
        }
        
        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
          .group\\/social-proof {
            max-width: calc(100% - 2rem);
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
