"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminConfirmModal from "@/app/components/AdminConfirmModal";
import ReelVideo from "@/app/components/ReelVideo";

// Admin Reel Card Component
function AdminReelCard({ reel, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group reel-card-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transition: 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transform: isHovered ? 'translateY(-8px) scale(1.05)' : 'translateY(0) scale(1)',
      }}
    >
      <ReelVideo
        videoUrl={reel.videoUrl}
        isHovered={isHovered}
        autoPlay={true}
        className="reel-card"
      >
        {/* Category Badge */}
        {reel.category && (
          <div className="mb-3 pointer-events-auto">
            <span className="inline-block px-3 py-1 text-[10px] font-medium tracking-wider uppercase rounded-full bg-white/10 backdrop-blur-sm text-white/90 border border-white/20">
              {reel.category}
            </span>
          </div>
        )}

        {/* Title - Max 2 lines */}
        <h2
          className="text-lg font-semibold text-white mb-2 leading-tight line-clamp-2 pointer-events-auto"
          style={{
            textShadow: '0 1px 8px rgba(0, 0, 0, 0.6)'
          }}
        >
          {reel.title || "Untitled Reel"}
        </h2>

        {/* Meta Information - Smaller, muted */}
        <div className="flex items-center gap-3 text-xs text-white/60 mb-3 pointer-events-auto">
          {reel.duration && (
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{reel.duration}</span>
            </div>
          )}

          {reel.createdAt && (
            <span>
              {new Date(reel.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Admin Actions */}
        <div className="mt-2 flex gap-2 pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(reel._id);
            }}
            className="
              px-3 py-1.5 rounded-lg text-xs font-semibold
              border border-rose-500/50 text-rose-400
              hover:bg-rose-500/10 transition-all duration-300
              backdrop-blur-sm bg-black/30
              hover:border-rose-500/80 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]
            "
          >
            Delete
          </button>
        </div>
      </ReelVideo>
    </div>
  );
}

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
        <div className="text-center py-24">
          <p className="text-white/60 text-lg mb-4 font-light">Loading reels...</p>
        </div>
      ) : reels.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-white/60 text-lg mb-4 font-light">No reels added yet.</p>
          <p className="text-white/40 text-sm">Add your first reel to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
          {reels.map((reel) => (
            <AdminReelCard
              key={reel._id}
              reel={reel}
              onDelete={(id) => {
                setSelectedId(id);
                setConfirmOpen(true);
              }}
            />
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
