"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

/**
 * GlobalModal - A reusable popup/modal component for the entire project
 * 
 * Design System:
 * - Dark glassmorphism background
 * - Soft blur overlay
 * - Rounded corners
 * - Clean typography
 * - Centered modal
 * - Smooth fade + scale animation (95% → 100%)
 * 
 * Features:
 * - ESC key to close
 * - Click outside to close
 * - Fully responsive
 * - Keyboard accessible
 * - Button hover effects (glow + scale)
 */
export default function GlobalModal({
  isOpen,
  onClose,
  title,
  message,
  primaryButtonText = "Continue",
  secondaryButtonText = "Cancel",
  onPrimaryAction,
  onSecondaryAction,
  showSecondaryButton = true,
  primaryButtonVariant = "default", // "default" | "danger"
}) {
  // Handle ESC key and body scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handlePrimaryClick = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else {
      onClose();
    }
  };

  const handleSecondaryClick = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    } else {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleBackdropClick}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className="pointer-events-auto w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1], // ease-out cubic-bezier
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Card - Dark Glassmorphism */}
              <div className="bg-gradient-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                {/* Content */}
                <div className="p-6 sm:p-8">
                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide mb-4 text-center">
                    {title}
                  </h2>

                  {/* Message */}
                  {message && (
                    <p className="text-white/80 text-center mb-8 text-sm sm:text-base leading-relaxed">
                      {message}
                    </p>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {/* Primary Button */}
                    <button
                      onClick={handlePrimaryClick}
                      className={`
                        relative flex-1 py-3 px-6 font-bold rounded-lg
                        transform transition-all duration-300
                        hover:scale-[1.02] active:scale-[0.98]
                        shadow-lg hover:shadow-xl
                        overflow-hidden group
                        ${
                          primaryButtonVariant === "danger"
                            ? "bg-gradient-to-r from-rose-500/90 to-red-600/90 text-white hover:from-rose-500 hover:to-red-600 hover:shadow-rose-500/30"
                            : "bg-gradient-to-r from-primary-400 to-primary-600 text-black hover:from-primary-500 hover:to-primary-700 hover:shadow-primary-400/30"
                        }
                      `}
                    >
                      <span className="relative z-10">{primaryButtonText}</span>
                      {/* Subtle glow effect on hover */}
                      <span
                        className={`absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-lg ${
                          primaryButtonVariant === "danger"
                            ? "group-hover:bg-white/5"
                            : ""
                        }`}
                      />
                    </button>

                    {/* Secondary Button */}
                    {showSecondaryButton && (
                      <button
                        onClick={handleSecondaryClick}
                        className="relative flex-1 py-3 px-6 bg-white/10 text-white font-semibold rounded-lg border border-white/20 transform transition-all duration-300 hover:scale-[1.02] hover:bg-white/15 hover:border-white/30 active:scale-[0.98] shadow-lg hover:shadow-xl hover:shadow-white/10 overflow-hidden group"
                      >
                        <span className="relative z-10">
                          {secondaryButtonText}
                        </span>
                        <span className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-300 rounded-lg" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
