"use client";

import { useEffect, useState } from "react";

function StarIcon({ filled, size = 20 }) {
  return filled ? (
    <svg
      width={size}
      height={size}
      fill="#fff"
      className="inline-block mx-[1px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.22)]"
      viewBox="0 0 24 24"
    >
      <path d="M12 18.25l6.16 3.73-1.64-7.04L21.92 9.5l-7.19-.61L12 2.5l-2.73 6.39-7.19.61 5.4 5.44L5.84 22z" />
    </svg>
  ) : (
    <svg
      width={size}
      height={size}
      fill="none"
      stroke="#fff"
      className="inline-block mx-[1px] opacity-60"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 18.25l6.16 3.73-1.64-7.04L21.92 9.5l-7.19-.61L12 2.5l-2.73 6.39-7.19.61 5.4 5.44L5.84 22z" />
    </svg>
  );
}

export default function RatingSummary({ summary }) {
  const [animatedWidths, setAnimatedWidths] = useState({});

  useEffect(() => {
    if (!summary || summary.totalReviews === 0) return;

    // Animate bar widths
    const timer = setTimeout(() => {
      const widths = {};
      [5, 4, 3, 2, 1].forEach((rating) => {
        const count = summary.ratingBreakdown[rating] || 0;
        const percentage =
          summary.totalReviews > 0
            ? (count / summary.totalReviews) * 100
            : 0;
        widths[rating] = percentage;
      });
      setAnimatedWidths(widths);
    }, 100);

    return () => clearTimeout(timer);
  }, [summary]);

  if (!summary || summary.totalReviews === 0) {
    return (
      <div className="text-center py-8 text-white/50">
        <p className="text-lg">No reviews yet</p>
        <p className="text-sm mt-2">Be the first to review this product!</p>
      </div>
    );
  }

  const averageRating = summary.averageRating || 0;
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 >= 0.5;

  return (
    <div className="w-full">
      {/* Large Average Rating Display */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <div className="text-center md:text-left">
          <div className="text-6xl md:text-7xl font-black text-white mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                filled={star <= fullStars || (star === fullStars + 1 && hasHalfStar)}
                size={28}
              />
            ))}
          </div>
          <div className="text-white/70 text-sm">
            Based on {summary.totalReviews}{" "}
            {summary.totalReviews === 1 ? "review" : "reviews"}
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="flex-1 w-full md:w-auto">
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = summary.ratingBreakdown[rating] || 0;
              const percentage = animatedWidths[rating] || 0;

              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-white/90 text-sm font-medium">
                      {rating}★
                    </span>
                  </div>
                  <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-white/30 to-white/50 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                  <span className="text-white/60 text-xs w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
