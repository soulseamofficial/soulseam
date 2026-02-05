"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderSuccessModal({ 
  isOpen, 
  onClose, 
  paymentMethod = "COD",
  orderId = null,
  clearCart = null
}) {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [particleStyles, setParticleStyles] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Disable body scroll
      document.body.style.overflow = "hidden";
      
      // Generate confetti particles
      const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 1,
      }));
      
      // Generate particle styles (colors) once
      const styles = Array.from({ length: 30 }, () => ({
        hue: Math.random() * 60 + 40,
        shadowHue: Math.random() * 60 + 40,
        animateX: (Math.random() - 0.5) * 100,
      }));
      
      // Delay state updates using requestAnimationFrame to avoid cascading renders
      const frameId = requestAnimationFrame(() => {
        setShowContent(true);
        setConfetti(particles);
        setParticleStyles(styles);
      });
      
      // Cleanup: cancel animation frame and reset state
      return () => {
        cancelAnimationFrame(frameId);
        document.body.style.overflow = "";
        setShowContent(false);
        setConfetti([]);
        setParticleStyles([]);
      };
    } else {
      // Re-enable body scroll
      document.body.style.overflow = "";
      
      // Delay state updates using requestAnimationFrame to avoid cascading renders
      const navFrame = requestAnimationFrame(() => {
        setIsNavigating(false);
      });
      
      // Delay state reset to avoid cascading renders
      const timeoutId = setTimeout(() => {
        setShowContent(false);
        setConfetti([]);
        setParticleStyles([]);
      }, 200);
      
      return () => {
        cancelAnimationFrame(navFrame);
        clearTimeout(timeoutId);
      };
    }
  }, [isOpen, onClose]);

  const handleTrackOrder = () => {
    // Prevent double clicking
    if (isNavigating) return;
    
    setIsNavigating(true);
    
    // Close modal first to allow animation to run
    onClose();
    
    // Wait for modal close animation before navigating
    setTimeout(() => {
      // Navigate to profile page with orderId as query parameter if available
      const trackUrl = orderId 
        ? `/profile?orderId=${encodeURIComponent(orderId)}`
        : "/profile";
      router.push(trackUrl);
    }, 300); // Wait for modal exit animation (0.4s transition, but 300ms is enough for UX)
  };

  const handleReturnToHome = () => {
    // Prevent double clicking
    if (isNavigating) return;
    
    setIsNavigating(true);
    
    // Clear cart if function is provided
    if (clearCart && typeof clearCart === 'function') {
      clearCart();
    }
    
    // Close modal first to allow animation to run
    onClose();
    
    // Wait for modal close animation before navigating
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  if (!isOpen) return null;

  const subtext = paymentMethod === "COD" 
    ? "Your order will be delivered soon"
    : "Payment received successfully";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Premium Dark Background with Gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Subtle Radial Glow */}
          <motion.div
            className="absolute inset-0 bg-radial-gradient"
            style={{
              background: "radial-gradient(circle at center, rgba(255, 215, 0, 0.08) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Confetti Particles */}
          {confetti.map((particle, idx) => {
            const style = particleStyles[idx] || { hue: 50, shadowHue: 50, animateX: 0 };
            return (
              <motion.div
                key={particle.id}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${particle.x}%`,
                  background: `hsl(${style.hue}, 70%, 60%)`,
                  boxShadow: `0 0 6px hsl(${style.shadowHue}, 70%, 60%)`,
                }}
                initial={{ y: particle.y, opacity: 0, scale: 0 }}
                animate={{
                  y: typeof window !== "undefined" ? window.innerHeight + 20 : 800,
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0],
                  x: particle.x + style.animateX,
                }}
                transition={{
                  delay: particle.delay,
                  duration: particle.duration,
                  ease: "easeOut",
                }}
              />
            );
          })}

          {/* Glassmorphism Card */}
          <motion.div
            className="relative z-10 w-full max-w-md mx-4"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.4,
            }}
          >
            <div
              className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-white/0 
                         border border-white/20 rounded-3xl p-8 sm:p-10
                         shadow-[0_25px_80px_rgba(255,255,255,0.15)]
                         overflow-hidden"
            >
              {/* Subtle inner glow */}
              <div
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: "radial-gradient(circle at 50% 30%, rgba(255, 215, 0, 0.15) 0%, transparent 60%)",
                }}
              />

              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Animated Success Icon */}
                <motion.div
                  className="relative mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: showContent ? 1 : 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1,
                  }}
                >
                  {/* Pulse Glow Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)",
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  
                  {/* Checkmark Circle */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-green-400/50 flex items-center justify-center">
                    {/* Animated SVG Checkmark */}
                    <svg
                      className="w-12 h-12 sm:w-14 sm:h-14 text-green-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.path
                        d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.15,
                          ease: "easeOut",
                        }}
                      />
                    </svg>
                  </div>
                </motion.div>

                {/* Heading */}
                <motion.h2
                  className="text-3xl sm:text-4xl font-black uppercase tracking-wider mb-3
                           bg-gradient-to-r from-white via-white/95 to-zinc-200/80 bg-clip-text text-transparent
                           drop-shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  Order Confirmed
                </motion.h2>

                {/* Subtext */}
                <motion.p
                  className="text-white/80 text-base sm:text-lg font-semibold mb-2 tracking-wide"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  {subtext}
                </motion.p>

                {/* Order ID (optional) */}
                {orderId && (
                  <motion.p
                    className="text-white/40 text-xs font-medium mt-2 tracking-wider"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showContent ? 1 : 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    Order ID: {orderId}
                  </motion.p>
                )}

                {/* CTA Buttons */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-3 mt-8 w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <button
                    onClick={handleTrackOrder}
                    disabled={isNavigating}
                    className="flex-1 px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider
                             bg-gradient-to-r from-white/10 to-white/5 
                             border border-white/30 hover:border-white/50
                             text-white hover:text-white
                             transition-all duration-200
                             hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)]
                             hover:scale-[1.02] active:scale-[0.98]
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isNavigating ? "Loading..." : "Track Your Order"}
                  </button>
                  <button
                    onClick={handleReturnToHome}
                    disabled={isNavigating}
                    className="flex-1 px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider
                             bg-gradient-to-r from-amber-500/20 to-yellow-500/20
                             border border-amber-400/40 hover:border-amber-400/60
                             text-amber-200 hover:text-amber-100
                             transition-all duration-200
                             hover:shadow-[0_8px_30px_rgba(255,215,0,0.2)]
                             hover:scale-[1.02] active:scale-[0.98]
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isNavigating ? "Loading..." : "Return To Home"}
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
