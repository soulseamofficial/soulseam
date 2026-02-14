"use client";

import { useState, useRef } from "react";
import { showToast } from "./Toast";

function StarIcon({ filled, onClick, size = 32 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/30 rounded"
      aria-label={`Rate ${filled ? filled : "empty"} star`}
    >
      {filled ? (
        <svg
          width={size}
          height={size}
          fill="#fff"
          className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.22)]"
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
          className="opacity-40"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 18.25l6.16 3.73-1.64-7.04L21.92 9.5l-7.19-.61L12 2.5l-2.73 6.39-7.19.61 5.4 5.44L5.84 22z" />
        </svg>
      )}
    </button>
  );
}

function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

export default function WriteReviewModal({ isOpen, onClose, productId, onSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const MAX_IMAGES = 4;
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    setError("");

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`Image "${file.name}" exceeds 2MB limit`);
        continue;
      }

      if (!file.type.startsWith("image/")) {
        setError(`File "${file.name}" is not an image`);
        continue;
      }

      // Create preview and upload immediately
      const reader = new FileReader();
      reader.onload = async (e) => {
        const previewUrl = e.target.result;
        const tempId = Date.now() + Math.random();
        
        // Add to uploading state
        setUploadingImages((prev) => [...prev, { file, previewUrl, id: tempId }]);
        
        // Upload immediately
        try {
          const imageUrl = await uploadImage(file, productId);
          // Move from uploading to uploaded
          setUploadingImages((prev) => prev.filter((item) => item.id !== tempId));
          setImages((prev) => [...prev, imageUrl]);
        } catch (err) {
          setError(`Failed to upload "${file.name}": ${err.message}`);
          setUploadingImages((prev) => prev.filter((item) => item.id !== tempId));
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file, productId) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("productId", productId);

    const response = await fetch("/api/reviews/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Upload failed");
    }

    const data = await response.json();
    return data.imageUrl;
  };


  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadingImage = (id) => {
    setUploadingImages((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Valid email is required");
      return;
    }

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (reviewText.trim().length < 20) {
      setError("Review text must be at least 20 characters");
      return;
    }

    // Wait for any pending uploads to complete
    if (uploadingImages.length > 0) {
      setError("Please wait for images to finish uploading");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          name: name.trim(),
          email: email.trim(),
          rating,
          reviewText: reviewText.trim(),
          images,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      // Success - reset form and close
      setName("");
      setEmail("");
      setRating(0);
      setReviewText("");
      setImages([]);
      setUploadingImages([]);
      onClose();
      showToast("Thank you for sharing your experience", "success");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setName("");
    setEmail("");
    setRating(0);
    setReviewText("");
    setImages([]);
    setUploadingImages([]);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-white/8 via-black/25 to-black backdrop-blur-2xl border border-white/12 rounded-3xl shadow-[0_18px_70px_rgba(255,255,255,0.14)]">
        {/* Inner glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.14)_0%,_rgba(0,0,0,0.92)_55%)] rounded-3xl" />

        <div className="relative z-10 p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Write a Review
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg disabled:opacity-50"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all"
                placeholder="Enter your name"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Your Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all"
                placeholder="your.email@example.com"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-3">
                Your Rating *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    filled={star <= rating}
                    onClick={() => setRating(star)}
                    size={40}
                  />
                ))}
                {rating > 0 && (
                  <span className="ml-4 text-white/70 text-sm">
                    {rating} out of 5
                  </span>
                )}
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Your Review * (minimum 20 characters)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all resize-none"
                placeholder="Share your experience with this product..."
                required
                disabled={isSubmitting}
                minLength={20}
              />
              <div className="mt-1 text-xs text-white/50">
                {reviewText.length}/2000 characters
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Add Photos (Optional, max {MAX_IMAGES})
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                disabled={isSubmitting || images.length + uploadingImages.length >= MAX_IMAGES}
                className="hidden"
                id="review-images"
              />
              <label
                htmlFor="review-images"
                className={`inline-block px-4 py-2 rounded-xl border border-white/15 bg-black/40 text-white/90 hover:bg-black/50 hover:border-white/25 transition-all cursor-pointer ${
                  images.length + uploadingImages.length >= MAX_IMAGES || isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                Choose Images
              </label>

              {/* Image Previews */}
              {(images.length > 0 || uploadingImages.length > 0) && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Review ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl border border-white/15"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={isSubmitting}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors disabled:opacity-50"
                        aria-label="Remove image"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ))}
                  {uploadingImages.map((item) => (
                    <div key={item.id} className="relative group">
                      <img
                        src={item.previewUrl}
                        alt="Uploading"
                        className="w-full h-32 object-cover rounded-xl border border-white/15 opacity-70"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white"></div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUploadingImage(item.id)}
                        disabled={isSubmitting}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors disabled:opacity-50"
                        aria-label="Remove image"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 rounded-xl border border-white/15 bg-black/40 text-white/90 hover:bg-black/50 hover:border-white/25 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 rounded-xl border border-white/20 bg-white/10 text-white font-semibold hover:bg-white/15 hover:border-white/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
