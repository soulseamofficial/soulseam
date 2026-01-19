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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#201134] to-fuchsia-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white/10 border border-fuchsia-700/40 rounded-2xl p-6 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-fuchsia-300 mb-6">
          Add Reel
        </h1>

        {/* Video */}
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4"
          onChange={handleFile}
          className="mb-4 w-full text-white"
        />

        {/* Title */}
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          className="w-full mb-4 p-2 rounded bg-black/40 text-white"
        />

        {/* Category */}
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full mb-4 p-2 rounded bg-black/40 text-white"
        >
          <option value="">Select category</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Duration */}
        <input
          type="text"
          name="duration"
          placeholder="Duration (mm:ss)"
          value={form.duration}
          onChange={handleChange}
          className="w-full mb-4 p-2 rounded bg-black/40 text-white"
        />

        {error && (
          <p className="text-red-400 mb-3 font-semibold">{error}</p>
        )}

        <button
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-400 to-pink-400 text-black font-bold"
        >
          {loading ? "Uploading..." : "Upload Reel"}
        </button>
      </form>
    </div>
  );
}
