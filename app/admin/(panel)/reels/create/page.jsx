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
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file || file.type !== "video/mp4") {
      setError("Only MP4 videos allowed");
      return;
    }
    setForm({ ...form, video: file });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.video || !form.title || !form.category || !form.duration) {
      return setError("All fields required");
    }

    setLoading(true);
    setTimeout(() => router.push("/admin/reels"), 800);
  }

  return (
    <div className="min-h-screen px-4 md:px-14 py-10 bg-black text-white">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        {/* Page Title */}
        <h1 className="text-3xl font-extrabold mb-10 bg-gradient-to-b from-white/90 to-white/60 bg-clip-text text-transparent tracking-wide">
          Add Reel
        </h1>

        {/* Main Card */}
        <div
          className="
            rounded-2xl border border-white/12
            shadow-[0_8px_32px_rgba(255,255,255,0.08)]
            backdrop-blur-xl
            transition-all duration-300
            bg-gradient-to-b from-white/8 via-black/20 to-black

            hover:shadow-[0_14px_60px_4px_rgba(255,255,255,0.18)]
            hover:scale-[1.012]
            overflow-hidden
          "
        >
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="flex flex-col">
              {/* Top (slightly lighter, controlled) */}
              <div className="w-full bg-gradient-to-b from-white/14 via-white/8 to-black/0 py-10 px-8 rounded-t-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* LEFT */}
                  <div className="space-y-6">
                    {/* Video */}
                    <div className="flex flex-col space-y-1">
                      <span className="text-[13px] text-white/70 font-semibold uppercase tracking-wider">
                        Video (MP4)
                      </span>
                      <input
                        type="file"
                        accept="video/mp4"
                        ref={fileRef}
                        onChange={handleFile}
                        className="
                          file:bg-white/10 file:hover:bg-white/20
                          file:text-white file:border-none
                          file:rounded-lg file:px-5 file:py-2
                          file:transition-all file:duration-200
                          w-full px-4 py-2 rounded-lg
                          bg-black/40 border border-white/10
                          text-white/80
                          hover:border-white/30
                          focus:outline-none focus:border-white/25
                        "
                      />
                    </div>

                    {/* Title */}
                    <div className="flex flex-col space-y-1">
                      <span className="text-[13px] text-white/70 font-semibold uppercase tracking-wider">
                        Title
                      </span>
                      <input
                        name="title"
                        placeholder="Reel Title"
                        value={form.title}
                        onChange={handleChange}
                        className="
                          w-full px-4 py-2 rounded-lg
                          bg-black/45 border border-white/10
                          text-white placeholder-white/40
                          hover:border-white/30
                          focus:outline-none focus:border-white/30
                        "
                      />
                    </div>

                    {/* Category */}
                    <div className="flex flex-col space-y-1">
                      <span className="text-[13px] text-white/70 font-semibold uppercase tracking-wider">
                        Category
                      </span>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="
                          w-full px-4 py-2 rounded-lg
                          bg-black/45 border border-white/10
                          text-white
                          hover:border-white/30
                          focus:outline-none focus:border-white/30
                        "
                      >
                        <option value="">Select Category</option>
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="space-y-6">
                    <div className="flex flex-col space-y-1">
                      <span className="text-[13px] text-white/70 font-semibold uppercase tracking-wider">
                        Duration
                      </span>
                      <input
                        name="duration"
                        placeholder="Duration (mm:ss)"
                        value={form.duration}
                        onChange={handleChange}
                        className="
                          w-full px-4 py-2 rounded-lg
                          bg-black/45 border border-white/10
                          text-white placeholder-white/40
                          hover:border-white/30
                          focus:outline-none focus:border-white/30
                        "
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom (dark dominant) */}
              <div className="w-full bg-gradient-to-b from-black/80 via-black/95 to-black px-8 py-8 rounded-b-2xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {error && (
                    <div className="text-sm text-rose-300 font-semibold bg-white/5 rounded px-4 py-2 border border-rose-400/30">
                      {error}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    className={`
                      py-3 px-10 rounded-xl font-bold
                      bg-white/10 border border-white/20
                      text-white
                      shadow-[0_2px_18px_2px_rgba(255,255,255,0.12)]
                      hover:bg-white/20 hover:border-white/30
                      hover:scale-[1.035]
                      hover:shadow-[0_4px_28px_4px_rgba(255,255,255,0.28)]
                      active:scale-[.98]
                      transition-all duration-200
                      ${loading ? "opacity-55 pointer-events-none" : ""}
                    `}
                  >
                    {loading ? "Uploading..." : "Upload Reel"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
