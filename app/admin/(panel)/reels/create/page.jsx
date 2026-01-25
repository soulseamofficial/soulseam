"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORY_OPTIONS = ["Story", "Vlog", "Explainer"];

export default function AddReelPage() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    video: null,
    title: "",
    category: "",
    duration: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError("");
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "video/mp4") {
      setError("Only .mp4 files allowed");
      return;
    }

    setForm((p) => ({ ...p, video: file }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.video || !form.title || !form.category || !form.duration) {
      return setError("All fields are required");
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("video", form.video);
    formData.append("title", form.title);
    formData.append("category", form.category);
    formData.append("duration", form.duration);

    const res = await fetch("/api/admin/reels", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Upload failed");
      setLoading(false);
      return;
    }

    // success → back to reels list
    router.push("/admin/reels");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-[#201134] to-fuchsia-950 py-12 px-4">
      <div className="w-full max-w-2xl bg-gradient-to-b from-white/10 to-white/0 border border-fuchsia-700/30 rounded-2xl p-0 md:p-0 shadow-[0_12px_54px_rgba(180,50,215,0.09)] backdrop-blur-xl">
        <form
          onSubmit={handleSubmit}
          className="w-full px-8 md:px-16 py-12"
        >
          <h1 className="text-4xl font-extrabold bg-gradient-to-br from-fuchsia-300 via-fuchsia-100 to-pink-100 bg-clip-text text-transparent mb-10 text-center tracking-tight drop-shadow-[0_4px_26px_rgba(200,100,250,0.12)]">
            Add Reel
          </h1>
          
          <div className="space-y-7">
            {/* Video */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-white/80">Video (.mp4)</label>
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4"
                onChange={handleFile}
                className="w-full rounded-lg px-3 py-2 bg-black/40 border border-fuchsia-600/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-none file:bg-fuchsia-500/20 file:text-fuchsia-200 focus:border-fuchsia-400 focus:ring-fuchsia-300"
              />
            </div>
            {/* Title */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-white/80">Title</label>
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-lg px-3 py-2 bg-black/40 border border-fuchsia-600/20 text-white focus:border-fuchsia-400 focus:ring-fuchsia-300"
              />
            </div>
            {/* Category */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-white/80">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-lg px-3 py-2 bg-black/40 border border-fuchsia-600/20 text-white focus:border-fuchsia-400 focus:ring-fuchsia-300"
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {/* Duration */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-white/80">
                Duration <span className="font-normal text-xs">(mm:ss)</span>
              </label>
              <input
                type="text"
                name="duration"
                placeholder="Duration (mm:ss)"
                value={form.duration}
                onChange={handleChange}
                className="w-full rounded-lg px-3 py-2 bg-black/40 border border-fuchsia-600/20 text-white focus:border-fuchsia-400 focus:ring-fuchsia-300"
              />
            </div>

            {error && (
              <div className="w-full flex justify-center">
                <p className="bg-gradient-to-r from-red-900/80 to-red-500/20 py-2 px-4 text-red-200 rounded-lg font-semibold text-center">{error}</p>
              </div>
            )}
            <button
              disabled={loading}
              className={`w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-400 to-pink-400 text-black font-bold tracking-wide shadow-lg transition-all duration-200 ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:from-pink-300 hover:to-fuchsia-400"
              }`}
            >
              {loading ? "Uploading..." : "Upload Reel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
