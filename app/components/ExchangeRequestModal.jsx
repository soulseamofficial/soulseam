"use client";

import { useState, useEffect } from "react";

const EXCHANGE_TYPES = [
  { value: "SIZE", label: "Size Change" },
  { value: "COLOR", label: "Color Change" },
  { value: "DEFECT", label: "Defective Product" },
  { value: "WRONG_ITEM", label: "Wrong Item Received" },
];

export default function ExchangeRequestModal({ isOpen, onClose, orderId, onSubmit }) {
  const [exchangeReason, setExchangeReason] = useState("");
  const [exchangeType, setExchangeType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setExchangeReason("");
      setExchangeType("");
      setError("");
    }
  }, [isOpen]);


  const handleSubmit = async () => {
    setError("");

    // Validate reason
    if (!exchangeReason.trim()) {
      setError("Please provide a reason for exchange");
      return;
    }

    // Validate type
    if (!exchangeType) {
      setError("Please select an exchange type");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          exchangeReason: exchangeReason.trim(),
          exchangeType: exchangeType,
          exchangeVideoUrl: null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit exchange request");
      }

      // Success - call onSubmit callback with success flag
      if (onSubmit) {
        onSubmit(data);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit exchange request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-white/10 via-black/30 to-black/95 border border-white/20 rounded-3xl shadow-[0_25px_90px_rgba(255,255,255,0.25)] backdrop-blur-xl p-8 animate-premiumSlideFadeIn max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white/90 transition-colors z-10"
          aria-label="Close"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold mb-2 bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-transparent">
            Request Exchange
          </h2>
          <p className="text-white/70 text-sm mb-3">
            Please provide a reason and select exchange type.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <p className="text-sm text-rose-400/90 font-semibold">{error}</p>
          </div>
        )}

        {/* Exchange Type */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white/90 mb-2">
            Exchange Type <span className="text-rose-400">*</span>
          </label>
          <select
            value={exchangeType}
            onChange={(e) => setExchangeType(e.target.value)}
            className="w-full rounded-2xl px-4 py-3 bg-black/85 border border-white/18 text-white/93 font-semibold outline-none ring-0 focus:ring-2 focus:ring-white/20 focus:border-white/46 hover:border-white/25 transition-all duration-600 ease-out"
          >
            <option value="">Select exchange type</option>
            {EXCHANGE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Exchange Reason */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white/90 mb-2">
            Reason for Exchange <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={exchangeReason}
            onChange={(e) => setExchangeReason(e.target.value)}
            placeholder="Please describe your reason for exchange..."
            rows={4}
            className="w-full rounded-2xl px-4 py-3 bg-black/85 border border-white/18 text-white/93 font-semibold placeholder:text-white/38 outline-none ring-0 focus:ring-2 focus:ring-white/20 focus:border-white/46 hover:border-white/25 transition-all duration-600 ease-out"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              submitting || 
              !exchangeReason.trim() || 
              !exchangeType
            }
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-white to-zinc-200 text-black font-extrabold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Exchange Request"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes premiumSlideFadeIn {
          from { opacity: 0; transform: translateY(21px) scale(.99); }
          32% { opacity: 1; }
          to { opacity: 1; transform: none; }
        }
        .animate-premiumSlideFadeIn {
          animation: premiumSlideFadeIn .84s cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </div>
  );
}
