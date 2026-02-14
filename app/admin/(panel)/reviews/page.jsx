"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminConfirmModal from "@/app/components/AdminConfirmModal";
import { showToast } from "@/app/components/Toast";

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 10,
  });

  // Delete modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  // Fetch reviews
  const fetchReviews = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/reviews?page=${pageNum}&limit=10`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        console.error("Failed to fetch reviews:", res.status);
        setReviews([]);
        return;
      }

      const data = await res.json();
      setReviews(data.reviews || []);
      setPagination(data.pagination || { total: 0, totalPages: 0, limit: 10 });
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!selectedReviewId) return;

    try {
      const res = await fetch(`/api/reviews/${selectedReviewId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const errorData = await res.json();
        showToast(errorData.error || "Failed to delete review", "error");
        return;
      }

      // Optimistic UI update - remove from list immediately
      setReviews((prev) => prev.filter((r) => r._id !== selectedReviewId));
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
      }));

      setConfirmOpen(false);
      setSelectedReviewId(null);
      showToast("Review deleted successfully", "success");

      // If current page becomes empty, go to previous page
      if (reviews.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete review", "error");
    }
  };

  // Truncate text helper
  const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Render stars
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? "text-yellow-400" : "text-white/20"
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Loading skeleton
  if (loading && reviews.length === 0) {
    return (
      <div className="px-8 py-10">
        <h1 className="text-3xl font-bold text-white mb-10">Reviews</h1>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-white/5 rounded-xl border border-white/10 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Reviews</h1>
        <p className="text-white/50">
          Manage all product reviews ({pagination.total} total)
        </p>
      </div>

      {/* TABLE CONTAINER */}
      <div
        className="
          relative overflow-hidden
          rounded-3xl
          bg-gradient-to-b from-white/8 via-black/25 to-black
          backdrop-blur-xl
          border border-white/12
          shadow-[0_18px_70px_rgba(255,255,255,0.14)]
        "
      >
        {/* TOP LIGHT EFFECT */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.14)_0%,_rgba(0,0,0,0.92)_55%)]" />

        {/* TABLE */}
        <div className="relative z-10 overflow-x-auto">
          {reviews.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/50 text-lg">No reviews found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">
                    Product Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">
                    Reviewer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">
                    Review Text
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white/80">
                    Images
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">
                    Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white/80">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review, index) => (
                  <tr
                    key={review._id}
                    className="
                      border-b border-white/5
                      hover:bg-white/5
                      transition-colors duration-200
                    "
                    style={{
                      animationDelay: `${index * 0.05}s`,
                    }}
                  >
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">
                        {review.productName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/90">{review.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/70 text-sm">
                        {review.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">{renderStars(review.rating)}</td>
                    <td className="px-6 py-4 max-w-xs">
                      <span
                        className="text-white/80 text-sm"
                        title={review.reviewText}
                      >
                        {truncateText(review.reviewText, 80)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white/70 text-sm">
                        {review.imageCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/60 text-sm">
                        {formatDate(review.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => {
                            setSelectedReviewId(review._id);
                            setConfirmOpen(true);
                          }}
                          className="
                            px-4 py-1.5 rounded-xl
                            border border-rose-500/50
                            text-rose-400 text-sm font-medium
                            hover:bg-rose-500/10
                            hover:scale-[1.03]
                            transition-all duration-200
                          "
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div className="relative z-10 px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-white/60 text-sm">
              Page {page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="
                  px-4 py-2 rounded-xl
                  bg-white/8 border border-white/15
                  text-white/80 text-sm font-medium
                  hover:bg-white/15 hover:text-white
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages}
                className="
                  px-4 py-2 rounded-xl
                  bg-white/8 border border-white/15
                  text-white/80 text-sm font-medium
                  hover:bg-white/15 hover:text-white
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <AdminConfirmModal
        open={confirmOpen}
        title="Are you sure you want to delete this review?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedReviewId(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
