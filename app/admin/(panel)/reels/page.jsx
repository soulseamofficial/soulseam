"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminReelsPage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchReels();
  }, []);

  async function fetchReels() {
    const res = await fetch("/api/admin/reels");
    const data = await res.json();
    setReels(data);
    setLoading(false);
  }

  async function deleteReel(id) {
    if (!confirm("Delete this reel?")) return;

    await fetch(`/api/admin/reels?id=${id}`, {
      method: "DELETE",
    });

    setReels(reels.filter((r) => r._id !== id));
  }

  return (
    <div className="min-h-screen px-8 py-10 bg-gradient-to-br from-black via-[#201134] to-fuchsia-950">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-fuchsia-300">
          Reels
        </h1>

        <button
          onClick={() => router.push("/admin/reels/create")}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-400 to-pink-400 text-black font-bold shadow hover:scale-105 transition"
        >
          + Add Reel
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-white">Loading...</p>
      ) : reels.length === 0 ? (
        <p className="text-fuchsia-200">No reels added yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {reels.map((reel) => (
            <div
              key={reel._id}
              className="bg-white/10 border border-fuchsia-700/40 rounded-xl p-4 shadow-lg"
            >
              <video
                src={reel.videoUrl}
                controls
                className="rounded-lg w-full h-56 object-cover mb-3 bg-black"
              />

              <h2 className="text-lg font-bold text-white">
                {reel.title}
              </h2>

              <p className="text-sm text-fuchsia-300">
                {reel.category} • {reel.duration}
              </p>

              <button
                onClick={() => deleteReel(reel._id)}
                className="mt-4 w-full py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-semibold"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
