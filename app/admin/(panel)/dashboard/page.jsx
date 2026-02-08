"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Animation utility
const FADE_IN_ANIMATION =
  "opacity-0 translate-y-6 animate-fade-in-up";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    products: 0,
    reels: 0,
    coupons: 0,
    users: 0,
    orders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const logout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    router.replace("/admin/login");
  };

  // ✅ FETCH STATS FROM DB - Single API call for all stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats", {
          credentials: "include",
          cache: "no-store",
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch stats");
        }

        const data = await res.json();
        // Set stats with fallback values to prevent crashes
        setStats({
          products: data?.products ?? 0,
          reels: data?.reels ?? 0,
          coupons: data?.coupons ?? 0,
          users: data?.users ?? 0,
          orders: data?.orders ?? 0,
        });
      } catch (err) {
        console.error("[Dashboard] Failed to load stats:", err);
        setError("Failed to load dashboard stats");
        // Keep default values (0) on error to prevent UI crash
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen px-8 py-10 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold mb-10 bg-gradient-to-br from-white via-white/96 to-zinc-200/80 bg-clip-text text-transparent drop-shadow-[0_4px_26px_rgba(255,255,255,0.11)] tracking-tight">
        Admin Dashboard
      </h1>

      {/* ===== Stats Cards ===== */}
      <div
        className={`grid grid-cols-2 lg:grid-cols-5 gap-8 mb-14 w-full max-w-5xl ${FADE_IN_ANIMATION}`}
        style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}
      >
        {loading ? (
          <>
            <StatCard label="Products" value="..." icon="🛍️" />
            <StatCard label="Reels" value="..." icon="🎬" />
            <StatCard label="Coupons" value="..." icon="🏷️" />
            <StatCard label="Users" value="..." icon="👤" />

            {/* Orders (loading) */}
            <div className="bg-gradient-to-b from-white/10 to-white/0 border border-white/15 rounded-2xl p-6 shadow-[0_20px_80px_rgba(255,255,255,0.13)] backdrop-blur-xl flex items-center space-x-4">
              <span className="text-4xl">📦</span>
              <div>
                <p className="text-sm text-white/70">Orders</p>
                <h2 className="text-3xl font-extrabold text-white">...</h2>
              </div>
            </div>
          </>
        ) : error ? (
          <div className="col-span-5 text-red-500 text-lg font-bold text-center">
            {error}
          </div>
        ) : (
          <>
            <StatCard label="Products" value={stats?.products ?? 0} icon="🛍️" />
            <StatCard label="Reels" value={stats?.reels ?? 0} icon="🎬" />
            <StatCard label="Coupons" value={stats?.coupons ?? 0} icon="🏷️" />
            <StatCard label="Users" value={stats?.users ?? 0} icon="👤" />

            {/* ✅ Orders (SUCCESS) */}
            <div
              onClick={() => router.push("/admin/orders")}
              className="cursor-pointer bg-gradient-to-b from-white/10 to-white/0 border border-white/15 rounded-2xl p-6 shadow-[0_20px_80px_rgba(255,255,255,0.13)] backdrop-blur-xl hover:-translate-y-1 hover:scale-105 hover:shadow-[0_32px_100px_rgba(255,255,255,0.19)] hover:border-white/25 transition-all duration-300 flex items-center space-x-4"
            >
              <span className="text-4xl">📦</span>
              <div>
                <p className="text-sm text-white/70">Orders</p>
                <h2 className="text-3xl font-extrabold text-white">
                  {stats?.orders ?? 0}
                </h2>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Stat Card ---------- */
function StatCard({ label, value, icon }) {
  return (
    <div className="bg-gradient-to-b from-white/10 to-white/0 border border-white/15 rounded-2xl p-6 shadow-[0_20px_80px_rgba(255,255,255,0.13)] backdrop-blur-xl hover:-translate-y-1 hover:scale-105 hover:shadow-[0_32px_100px_rgba(255,255,255,0.19)] hover:border-white/25 transition-all duration-300 flex items-center space-x-4">
      <span className="text-4xl">{icon}</span>
      <div>
        <p className="text-sm text-white/70">{label}</p>
        <h2 className="text-3xl font-extrabold text-white">{value}</h2>
      </div>
    </div>
  );
}