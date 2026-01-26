"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function AdminConfirmModal({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP – same admin darkness */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* MODAL WRAPPER */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {/* MODAL CARD */}
            <div
              className="
                relative w-full max-w-md
                rounded-3xl
                border border-white/15
                bg-gradient-to-b from-white/10 via-black/30 to-black
                backdrop-blur-2xl
                shadow-[0_18px_70px_rgba(255,255,255,0.14)]
                overflow-hidden
              "
            >
              {/* TOP-ONLY WHITE LIGHT (same as Orders / Cards) */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.16)_0%,_rgba(0,0,0,0.92)_55%)]" />

              {/* CONTENT */}
              <div className="relative z-10 p-8 text-center">
                <h2 className="text-xl font-bold text-white mb-3">
                  {title}
                </h2>

                <p className="text-white/65 mb-8">
                  {message}
                </p>

                <div className="flex justify-center gap-4">
                  {/* CANCEL */}
                  <button
                    onClick={onCancel}
                    className="
                      px-6 py-2.5 rounded-xl
                      bg-white/8 border border-white/15
                      text-white/80
                      hover:bg-white/15 hover:text-white
                      hover:scale-[1.03]
                      transition-all duration-200
                    "
                  >
                    {cancelText}
                  </button>

                  {/* CONFIRM */}
                  <button
                    onClick={onConfirm}
                    className="
                      px-6 py-2.5 rounded-xl
                      border border-rose-500/50
                      text-rose-400
                      hover:bg-rose-500/10
                      hover:scale-[1.03]
                      transition-all duration-200
                    "
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
