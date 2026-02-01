"use client";

import { useState, useEffect } from "react";

let toastId = 0;
const listeners = new Set();

export function showToast(message, type = "info") {
  const id = ++toastId;
  listeners.forEach((listener) => listener({ id, message, type }));
  return id;
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return toasts;
}

export default function ToastContainer() {
  const toasts = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => {
        const bgColor =
          toast.type === "success"
            ? "bg-green-500/20 border-green-400/50 text-green-300"
            : toast.type === "error"
            ? "bg-rose-500/20 border-rose-400/50 text-rose-300"
            : "bg-blue-500/20 border-blue-400/50 text-blue-300";

        return (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg min-w-[300px] max-w-md animate-slideIn ${bgColor}`}
          >
            <p className="text-sm font-semibold">{toast.message}</p>
          </div>
        );
      })}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
