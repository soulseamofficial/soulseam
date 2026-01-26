"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminConfirmModal from "@/app/components/AdminConfirmModal";

export default function AdminReelsPage() {
  const router = useRouter();

  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 delete modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  /* FETCH REELS */
  const fetchReels = async () => {
    try {
      const res = await fetch("/api/admin/reels");
      const data = await res.json();
      setReels(data);
    } catch {
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  /* CONFIRM DELETE */
  const handleConfirmDelete = async () => {
    await fetch(`/api/admin/reels?id=${selectedId}`, {
      method: "DELETE",
    });

    setConfirmOpen(false);
    setSelectedId(null);
    fetchReels();
  };

  return (
    <div className="px-8 py-10">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-white">Reels</h1>

        <button
          onClick={() => router.push("/admin/reels/create")}
          className="
            px-6 py-2.5 rounded-xl
            bg-white/10 border border-white/20
            text-white font-semibold
            hover:bg-white/15 hover:border-white/30
            transition
          "
        >
          + Add Reel
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <p className="text-white/60">Loading...</p>
      ) : reels.length === 0 ? (
        <p className="text-white/50">No reels added yet.</p>
      ) : (
        <div className="space-y-8">
          {reels.map((reel) => (
            <div
              key={reel._id}
              className="
                relative overflow-hidden
                rounded-3xl
                bg-gradient-to-b from-white/8 via-black/25 to-black
                backdrop-blur-xl
                border border-white/12
                p-6
                transition-all duration-300
                hover:scale-[1.015]
                hover:shadow-[0_10px_45px_rgba(255,255,255,0.18)]
              "
            >
              {/* TOP-ONLY WHITE GLOW */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.14)_0%,_rgba(0,0,0,0.9)_55%)]" />

              <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* VIDEO */}
                <video
                  src={reel.videoUrl}
                  controls
                  className="w-full h-64 rounded-2xl object-cover bg-black"
                />

                {/* DETAILS */}
                <div className="text-white flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-white/50">Title</p>
                    <p className="font-semibold text-lg">{reel.title}</p>

                    <p className="mt-4 text-sm text-white/50">Category</p>
                    <p className="font-semibold">{reel.category}</p>

                    <p className="mt-4 text-sm text-white/50">Duration</p>
                    <p className="font-semibold">{reel.duration}</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedId(reel._id);
                      setConfirmOpen(true);
                    }}
                    className="
                      mt-6 px-5 py-2 rounded-xl
                      border border-rose-500/50
                      text-rose-400
                      hover:bg-rose-500/10
                      transition w-fit
                    "
                  >
                    Delete Reel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔥 CONFIRM MODAL */}
      <AdminConfirmModal
        open={confirmOpen}
        title="Delete this reel?"
        message="This reel will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedId(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
