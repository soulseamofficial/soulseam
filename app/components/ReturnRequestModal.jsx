"use client";

import { useState, useRef, useEffect } from "react";

const RETURN_REASONS = [
  "Defective/Damaged Product",
  "Wrong Item Received",
  "Size/Color Mismatch",
  "Quality Issues",
  "Not as Described",
  "Changed My Mind",
  "Other"
];

export default function ReturnRequestModal({ isOpen, onClose, orderId, onSubmit }) {
  const [returnReason, setReturnReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setReturnReason("");
      setCustomReason("");
      setVideoFile(null);
      setVideoPreview(null);
      setVideoUrl(null);
      setError("");
    }
  }, [isOpen]);

  // Validate video duration
  const validateVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        if (duration < 30) {
          reject(new Error("Video must be at least 30 seconds long"));
        } else if (duration > 60) {
          reject(new Error("Video must not exceed 60 seconds"));
        } else {
          resolve();
        }
      };
      video.onerror = () => reject(new Error("Failed to load video"));
      video.src = URL.createObjectURL(file);
    });
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Validate file type
    const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only MP4, MOV, and WEBM are allowed.");
      return;
    }

    // Validate file size (50 MB max)
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      setError("File size exceeds 50 MB limit");
      return;
    }

    // Validate duration
    try {
      await validateVideoDuration(file);
    } catch (err) {
      setError(err.message);
      return;
    }

    setVideoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
  };

  const handleUploadVideo = async () => {
    if (!videoFile) {
      setError("Please select a video file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("video", videoFile);

      const res = await fetch(`/api/orders/${orderId}/return/upload-video`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload video");
      }

      if (!data.videoUrl) {
        throw new Error("Video upload succeeded but no video URL was returned");
      }

      setVideoUrl(data.videoUrl);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to upload video. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");

    // Validate reason
    const finalReason = returnReason === "Other" ? customReason.trim() : returnReason;
    if (!finalReason) {
      setError("Please select or provide a return reason");
      return;
    }

    // Validate video
    if (!videoUrl) {
      setError("Please upload a return video");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          returnReason: finalReason,
          returnVideoUrl: videoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit return request");
      }

      // Success - call onSubmit callback
      if (onSubmit) {
        onSubmit(data);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit return request. Please try again.");
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
            Request Return
          </h2>
          <p className="text-white/70 text-sm">
            Please provide a reason and upload a video showing the product condition
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <p className="text-sm text-rose-400/90 font-semibold">{error}</p>
          </div>
        )}

        {/* Return Reason */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white/90 mb-2">
            Reason for Return <span className="text-rose-400">*</span>
          </label>
          <select
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            className="w-full rounded-2xl px-4 py-3 bg-black/85 border border-white/18 text-white/93 font-semibold outline-none ring-0 focus:ring-2 focus:ring-white/20 focus:border-white/46 hover:border-white/25 transition-all duration-600 ease-out"
          >
            <option value="">Select a reason</option>
            {RETURN_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>

          {/* Custom Reason Input */}
          {returnReason === "Other" && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Please describe your reason for return..."
              rows={3}
              className="mt-3 w-full rounded-2xl px-4 py-3 bg-black/85 border border-white/18 text-white/93 font-semibold placeholder:text-white/38 outline-none ring-0 focus:ring-2 focus:ring-white/20 focus:border-white/46 hover:border-white/25 transition-all duration-600 ease-out"
            />
          )}
        </div>

        {/* Video Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white/90 mb-2">
            Upload Return Video <span className="text-rose-400">*</span>
          </label>
          <p className="text-xs text-white/60 mb-3">
            Video must be 30-60 seconds long, max 50 MB. Formats: MP4, MOV, WEBM
          </p>

          {!videoPreview && !videoUrl && (
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center hover:border-white/40 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleVideoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition-all"
              >
                Select Video File
              </button>
              {videoFile && (
                <p className="mt-2 text-sm text-white/70">
                  Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}

          {/* Video Preview */}
          {videoPreview && !videoUrl && (
            <div className="space-y-3">
              <video
                ref={videoRef}
                src={videoPreview}
                controls
                className="w-full rounded-2xl border border-white/20 max-h-64"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleUploadVideo}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-white to-zinc-200 text-black font-extrabold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "Uploading..." : "Upload Video"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={uploading}
                  className="px-6 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Uploaded Video */}
          {videoUrl && (
            <div className="space-y-3">
              <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-400 font-semibold">Video uploaded successfully</span>
              </div>
              <video
                src={videoUrl}
                controls
                className="w-full rounded-2xl border border-white/20 max-h-64"
              />
              <button
                type="button"
                onClick={() => {
                  setVideoUrl(null);
                  setVideoFile(null);
                  setVideoPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-all"
              >
                Change Video
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={submitting || uploading}
            className="flex-1 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              submitting || 
              uploading || 
              !videoUrl || 
              !returnReason || 
              (returnReason === "Other" && !customReason.trim())
            }
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-white to-zinc-200 text-black font-extrabold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Return Request"}
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
