"use client";

import React from "react";

export default function MobileCheckoutHeader({ currentStep, onBack }) {
  const stepLabels = {
    information: "Information",
    shipping: "Shipping",
    payment: "Payment",
  };

  const stepNumber = {
    information: 1,
    shipping: 2,
    payment: 3,
  };

  const currentStepNumber = stepNumber[currentStep] || 1;
  const currentStepLabel = stepLabels[currentStep] || "Information";

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
          aria-label="Go back"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Step Indicator */}
        <div className="flex-1 flex items-center justify-center gap-2 mx-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((num) => (
              <React.Fragment key={num}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    num <= currentStepNumber
                      ? "bg-gradient-to-r from-white via-white/90 to-zinc-200/70 text-black"
                      : "bg-white/5 text-white/40 border border-white/10"
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-8 h-0.5 transition-all duration-200 ${
                      num < currentStepNumber
                        ? "bg-gradient-to-r from-white/60 via-white/50 to-zinc-200/40"
                        : "bg-white/10"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Label */}
        <div className="text-sm font-semibold text-white/90 uppercase tracking-wide min-w-[80px] text-right">
          {currentStepLabel}
        </div>
      </div>
    </div>
  );
}
