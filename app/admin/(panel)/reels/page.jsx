"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Categories should match your needs
const CATEGORY_OPTIONS = ["Story", "Vlog", "Explainer"];

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024, dm = 2;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function AdminVideoUpload() {
  const router = useRouter();

  // Auth check - redirect to /admin/login if admin not present
  useEffect(() => {
    const ok = sessionStorage.getItem("admin");
    if (ok !== "1") router.replace("/admin/login");
  }, [router]);

  const [fields, setFields] = useState({
    video: null,
    title: "",
    category: "",
    duration: "",
  });

  const [videoPreview, setVideoPreview] = useState(null);
  const [fileInfo, setFileInfo] = useState({ name: "", size: "" });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  // Clean up video preview object URL
  useEffect(() => {
    return () => videoPreview && URL.revokeObjectURL(videoPreview);
  }, [videoPreview]);

  function handleFieldChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.type !== "video/mp4") {
      setError("Only .mp4 files are allowed");
      setFields((prev) => ({ ...prev, video: null }));
      setVideoPreview(null);
      setFileInfo({ name: "", size: "" });
      return;
    }

    setFields((prev) => ({ ...prev, video: file }));
    setVideoPreview(URL.createObjectURL(file));
    setFileInfo({ name: file.name, size: formatFileSize(file.size) });
    setError("");
    setSuccess("");
  }

  function isFormValid() {
    return (
      fields.video &&
      fields.title.trim() &&
      fields.category &&
      /^\d{1,2}:\d{2}$/.test(fields.duration.trim())
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fields.video) return setError("Please choose an .mp4 video file.");
    if (!fields.title.trim()) return setError("Title is required.");
    if (!fields.category) return setError("Category is required.");
    if (!fields.duration.match(/^\d{1,2}:\d{2}$/)) return setError("Duration must be in mm:ss format (e.g. 01:25)");

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("video", fields.video);
      formData.append("title", fields.title);
      formData.append("category", fields.category);
      formData.append("duration", fields.duration);

      const res = await fetch("/api/reels", {
        method: "POST",
        body: formData
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || "Upload failed");
        setIsLoading(false);
        return;
      }
      

      setSuccess("Video uploaded successfully!");
      setFields({ video: null, title: "", category: "", duration: "" });
      setFileInfo({ name: "", size: "" });
      setVideoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError("Upload failed.");
    }
    setIsLoading(false);
    setTimeout(() => setSuccess(""), 2600);
  }

  // Modern matching UI, echo admin dashboard look & feel
  const FADE_IN_ANIMATION = "opacity-0 translate-y-6 animate-fade-in-up";

  return (
    <div className="min-h-screen px-8 py-10 bg-gradient-to-br from-black via-[#201134] to-fuchsia-950 flex flex-col items-center">
      <h1
        className="text-4xl font-extrabold mb-10 bg-gradient-to-r from-fuchsia-300 via-pink-400 to-violet-500 text-transparent bg-clip-text drop-shadow-lg transition-all animate-pulse"
      >
        Upload Reel
      </h1>

      <div
        className={
          "w-full max-w-xl rounded-[2.3rem] shadow-xl ring-1 ring-fuchsia-600/20 bg-gradient-to-br from-neutral-900/95 via-black/90 to-fuchsia-950/99 p-4 sm:p-8 flex flex-col gap-7 border border-white/10 shadow-fuchsia-900/5 " +
          FADE_IN_ANIMATION
        }
        style={{ animationDelay: '0.19s', animationFillMode: 'forwards', backdropFilter: "blur(9px)", fontFamily: "Inter, 'Segoe UI', Arial, sans-serif" }}
      >
        <form
          className="flex flex-col gap-8"
          autoComplete="off"
          onSubmit={handleSubmit}
        >
          {/* Video Input */}
          <div>
            <label className="block text-base sm:text-lg font-semibold text-white mb-2">
              Video File <span className="text-fuchsia-300 text-base ml-1">.mp4*</span>
            </label>
            <input
              type="file"
              accept="video/mp4"
              name="video"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="block w-full rounded-xl border border-fuchsia-800/30 bg-neutral-900/80 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow"
            />
            {videoPreview && fields.video && (
              <div className="flex gap-5 items-center mt-4">
                <div className="rounded-2xl border border-fuchsia-700/25 bg-black/80 shadow-md overflow-hidden h-36 w-24 flex items-center justify-center">
                  <video
                    src={videoPreview}
                    className="object-cover w-full h-full"
                    style={{ minHeight: 110, maxHeight: 144, backgroundColor: "#000" }}
                    controls
                    muted
                  />
                </div>
                <div className="ml-1 mt-2 flex flex-col gap-1 overflow-hidden">
                  <div className="text-fuchsia-200 text-[15px] truncate font-medium flex items-center gap-2">
                    <span className="inline-block max-w-[140px] truncate" title={fileInfo.name}>{fileInfo.name}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{fileInfo.size}</span>
                  <span className="text-fuchsia-400/80 font-bold text-xs tracking-wider mt-1">Preview</span>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-base sm:text-lg font-semibold text-white mb-2">
              Title<span className="text-fuchsia-300 ml-1">*</span>
            </label>
            <input
              type="text"
              name="title"
              maxLength={64}
              autoComplete="off"
              value={fields.title}
              onChange={handleFieldChange}
              placeholder="Enter video title"
              className="block w-full rounded-xl border border-fuchsia-800/30 bg-neutral-900/80 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-base sm:text-lg font-semibold text-white mb-2">
              Category<span className="text-fuchsia-300 ml-1">*</span>
            </label>
            <select
              name="category"
              value={fields.category}
              onChange={handleFieldChange}
              className="block w-full rounded-xl border border-fuchsia-800/30 bg-neutral-900/80 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow"
            >
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-base sm:text-lg font-semibold text-white mb-2">
              Duration <span className="text-fuchsia-300 ml-1">*</span>
            </label>
            <input
              type="text"
              name="duration"
              value={fields.duration}
              onChange={handleFieldChange}
              maxLength={5}
              autoComplete="off"
              pattern="\d{1,2}:\d{2}"
              placeholder="e.g. 01:25"
              className="block w-40 rounded-xl border border-fuchsia-800/30 bg-neutral-900/80 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow"
            />
            <span className="block text-[13px] text-gray-400 font-medium pt-1 pl-1">
              mm:ss format
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-900/70 border border-red-500/20 text-red-200 py-2 px-4 font-semibold shadow-sm animate-fade-in-up" style={{ animationDelay: '0.28s', animationFillMode: 'forwards' }}>
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="rounded-lg bg-gradient-to-r from-fuchsia-700/80 via-fuchsia-950/70 to-violet-900/70 border border-fuchsia-400/60 text-fuchsia-200 py-2 px-4 font-semibold shadow drop-shadow animate-fade-in-up" style={{ animationDelay: '0.28s', animationFillMode: 'forwards' }}>
              {success}
            </div>
          )}

          {/* Upload Button */}
          <button
            type="submit"
            className={`
              w-full flex items-center justify-center gap-2
              text-lg font-bold py-3 rounded-xl bg-gradient-to-r from-fuchsia-400 via-pink-400 to-violet-400
              shadow-lg shadow-fuchsia-800/30
              text-black tracking-wide
              hover:scale-[1.012] hover:from-fuchsia-300 hover:to-fuchsia-400
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-200
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
            style={{ fontFamily: "inherit" }}
            disabled={isLoading || !isFormValid()}
          >
            {isLoading && (
              <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {isLoading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      {/* Fun animation bottom icon and gentle greeting */}
      <div className="flex flex-col items-center mt-14 animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
        <div className="w-20 h-20 rounded-full border-4 border-fuchsia-400 bg-gradient-to-tr from-fuchsia-700 via-violet-900 to-fuchsia-900 flex items-center justify-center mb-2 animate-spin-slow shadow-2xl">
          <span className="text-3xl select-none animate-pulse">🎬</span>
        </div>
        <p className="text-white/80 text-lg font-bold text-center">
          Submit a new video reel!
        </p>
        <p className="text-fuchsia-100 mt-1 text-center max-w-md text-base">
          Fill out the details and start sharing creative moments.
        </p>
      </div>
    </div>
  );
}