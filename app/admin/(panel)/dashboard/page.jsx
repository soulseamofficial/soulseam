"use client";

import { useEffect, useState } from "react";

// Animation utility
const FADE_IN_ANIMATION =
  "opacity-0 translate-y-6 animate-fade-in-up";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    reels: 0,
    coupons: 0,
    users: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ FETCH STATS FROM DB
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen px-8 py-10 bg-gradient-to-br from-black via-[#201134] to-fuchsia-950 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold mb-10 bg-gradient-to-r from-fuchsia-300 via-pink-400 to-violet-500 text-transparent bg-clip-text drop-shadow-lg animate-pulse">
        Admin Dashboard
      </h1>

      {/* ===== Stats Cards ===== */}
      <div
        className={`grid grid-cols-2 lg:grid-cols-4 gap-8 mb-14 w-full max-w-4xl ${FADE_IN_ANIMATION}`}
        style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}
      >
        {loading ? (
          <>
            <StatCard label="Products" value="..." icon="🛍️" />
            <StatCard label="Reels" value="..." icon="🎬" />
            <StatCard label="Coupons" value="..." icon="🏷️" />
            <StatCard label="Users" value="..." icon="👤" />
          </>
        ) : error ? (
          <div className="col-span-4 text-red-500 text-lg font-bold text-center">
            {error}
          </div>
        ) : (
          <>
            <StatCard label="Products" value={stats.products} icon="🛍️" />
            <StatCard label="Reels" value={stats.reels} icon="🎬" />
            <StatCard label="Coupons" value={stats.coupons} icon="🏷️" />
            <StatCard label="Users" value={stats.users} icon="👤" />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Stat Card ---------- */
function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white/10 border border-fuchsia-700/40 rounded-2xl p-6 shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center space-x-4">
      <span className="text-4xl">{icon}</span>
      <div>
        <p className="text-sm text-fuchsia-200">{label}</p>
        <h2 className="text-3xl font-extrabold text-white">{value}</h2>
      </div>
    </div>
  );
}
