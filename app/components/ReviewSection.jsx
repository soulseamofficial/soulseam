"use client";

import { useState, useEffect } from "react";
import RatingSummary from "./RatingSummary";
import WriteReviewModal from "./WriteReviewModal";

function StarIcon({ filled, size = 18 }) {
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

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function ImageLightbox({ images, isOpen, onClose, initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0)
        setCurrentIndex(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < images.length - 1)
        setCurrentIndex(currentIndex + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl font-bold z-10"
        aria-label="Close"
      >
        ✕
      </button>
      <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`Review image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(currentIndex - 1);
                }}
                className="absolute left-4 p-3 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                aria-label="Previous image"
              >
                ←
              </button>
            )}
            {currentIndex < images.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(currentIndex + 1);
                }}
                className="absolute right-4 p-3 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                aria-label="Next image"
              >
                →
              </button>
            )}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/80 text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const limit = 5;

  const fetchReviews = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reviews?productId=${productId}&page=${pageNum}&limit=${limit}`
      );
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews || []);
        setSummary(data.summary);
        setHasMore(data.pagination.totalPages > pageNum);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews(page);
    }
  }, [productId, page]);

  const handleReviewSubmitted = () => {
    // Refresh reviews
    fetchReviews(1);
    setPage(1);
  };

  const openLightbox = (images, index) => {
    setLightboxImage(images);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxIndex(0);
  };

  // Glassmorphism styles matching product page
  const glassCard =
    "relative overflow-hidden bg-gradient-to-b from-white/8 via-black/25 to-black backdrop-blur-2xl border border-white/12 rounded-3xl shadow-[0_18px_70px_rgba(255,255,255,0.14)]";
  const glassCardInner =
    "absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.14)_0%,_rgba(0,0,0,0.92)_55%)]";

  return (
    <section className="w-full py-8 md:py-12 px-4 md:px-6 animate-fade-in-up">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Customer Reviews
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-xl border border-white/20 bg-white/10 text-white font-semibold hover:bg-white/15 hover:border-white/30 hover:scale-[1.02] transition-all"
          >
            Write a Review
          </button>
        </div>

        {/* Review Container */}
        <div className={glassCard}>
          <div className={glassCardInner} />
          <div className="relative z-10 p-6 md:p-10">
            {loading ? (
              <div className="text-center py-12 text-white/50">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white mx-auto mb-4"></div>
                <p>Loading reviews...</p>
              </div>
            ) : (
              <>
                {/* Rating Summary */}
                {summary && <RatingSummary summary={summary} />}

                {/* Reviews List */}
                {reviews.length > 0 ? (
                  <div className="space-y-6 mt-8">
                    {reviews.map((review) => (
                      <div
                        key={review._id}
                        className="pb-6 border-b border-white/10 last:border-0 last:pb-0"
                      >
                        {/* Review Header */}
                        <div className="flex items-start gap-4 mb-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-white font-bold text-lg border border-white/20">
                            {getInitials(review.name)}
                          </div>

                          {/* Name and Rating */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-white font-semibold">
                                {review.name}
                              </span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <StarIcon
                                    key={star}
                                    filled={star <= review.rating}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-white/50 text-xs">
                              {formatDate(review.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Review Text */}
                        <p className="text-white/80 leading-relaxed mb-4">
                          {review.reviewText}
                        </p>

                        {/* Review Images */}
                        {review.images && review.images.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            {review.images.map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => openLightbox(review.images, idx)}
                                className="relative group overflow-hidden rounded-xl border border-white/15 hover:border-white/30 transition-all hover:scale-105"
                              >
                                <img
                                  src={img}
                                  alt={`Review image ${idx + 1}`}
                                  className="w-full h-32 object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-white/50">
                    <p className="text-lg mb-2">No reviews yet</p>
                    <p className="text-sm">
                      Be the first to share your experience!
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setPage(page + 1)}
                      className="px-6 py-3 rounded-xl border border-white/15 bg-black/40 text-white/90 hover:bg-black/50 hover:border-white/25 transition-all"
                    >
                      Load More Reviews
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Write Review Modal */}
      {isModalOpen && (
        <WriteReviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productId={productId}
          onSuccess={handleReviewSubmitted}
        />
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          images={lightboxImage}
          isOpen={!!lightboxImage}
          onClose={closeLightbox}
          initialIndex={lightboxIndex}
        />
      )}
    </section>
  );
}
