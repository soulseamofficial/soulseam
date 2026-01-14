"use client";

import { useEffect, useState } from "react";

// Add simple fade-in-up animation utility class
const FADE_IN_ANIMATION =
  "opacity-0 translate-y-6 animate-fade-in-up"; // you'll need to add this keyframes anim in your global css

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    reels: 0,
    coupons: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen px-8 py-10 bg-gradient-to-br from-black via-[#201134] to-fuchsia-950 flex flex-col items-center">
      <h1
        className="text-4xl font-extrabold mb-10 bg-gradient-to-r from-fuchsia-300 via-pink-400 to-violet-500 text-transparent bg-clip-text drop-shadow-lg transition-all animate-pulse"
      >
        Admin Dashboard
      </h1>

      {/* ======= Stats Section ======= */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-14 w-full max-w-4xl ${FADE_IN_ANIMATION}`}
        style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}
      >
        {loading ? (
          <>
            <StatCard label="Products" value="..." icon="🛍️" />
            <StatCard label="Reels" value="..." icon="🎬" />
            <StatCard label="Coupons" value="..." icon="🏷️" />
            <StatCard label="Users" value="..." icon="👤" />
          </>
        ) : error ? (
          <div className="col-span-4 text-red-500 text-lg font-bold text-center">{error}</div>
        ) : (
          <>
            <StatCard label="Products" value={stats.products} icon="🛍️" />
            <StatCard label="Reels" value={stats.reels} icon="🎬" />
            <StatCard label="Coupons" value={stats.coupons} icon="🏷️" />
            <StatCard label="Users" value={stats.users} icon="👤" />
          </>
        )}
      </div>

      {/* ======= Animation after stat cards ======= */}
      <div className="flex flex-col items-center mt-12 animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
        <div className="w-24 h-24 rounded-full border-4 border-fuchsia-400 bg-gradient-to-tr from-fuchsia-700 via-violet-900 to-fuchsia-900 flex items-center justify-center mb-4 animate-spin-slow shadow-2xl">
          <span className="text-4xl select-none animate-pulse">✨</span>
        </div>
        <p className="text-white/80 text-lg font-bold text-center">
          Welcome to the <span className="text-fuchsia-300">Admin Panel</span>!
        </p>
        <p className="text-fuchsia-100 mt-2 text-center max-w-md">
          Use the menu to manage your store. More features coming soon.
        </p>
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white/10 border border-fuchsia-700/40 rounded-2xl p-6 shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center space-x-4 group">
      <span className="text-4xl transition group-hover:rotate-[12deg] drop-shadow">{icon}</span>
      <div>
        <p className="text-sm text-fuchsia-200 group-hover:text-fuchsia-100">{label}</p>
        <h2 className="text-3xl font-extrabold text-white group-hover:text-fuchsia-100 transition">{value}</h2>
      </div>
    </div>
  );
}

