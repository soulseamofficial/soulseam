"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Add simple fade-in-up animation utility class (from globals.css)
// .animate-fade-in-up { animation: fade-in-up 0.7s ease-out forwards; }

export default function AdminLayout({ children }) {
  const router = useRouter();

  const menu = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Reels", path: "/admin/reels" },
    { name: "Products", path: "/admin/products" },
    { name: "Coupons", path: "/admin/coupons" }
  ];

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("admin");
    if (isAdmin !== "1") {
      router.replace("/admin/login");
    }
  }, []);

  // Logout handler
  function handleLogout() {
    sessionStorage.removeItem("admin");
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-[#0B0B12] text-white relative">

      {/* Logout button in top right corner */}
      <button
        onClick={handleLogout}
        className="absolute top-5 right-6 z-40 px-5 py-2 rounded-lg bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold text-base shadow-lg animate-fade-in-up"
        style={{
          animationDelay: "0.35s",
          animationFillMode: "forwards"
        }}
        aria-label="Logout"
      >
        Logout
      </button>

      {/* Sidebar */}
      {/* Add fade-in and slight slide from left animation to sidebar */}
      <aside
        className="w-64 bg-[#0F0F19] border-r border-white/10 p-6 animate-fade-in-up"
        style={{ animationDelay: "0.10s", animationFillMode: "forwards" }}
      >
        {/* Sidebar logout button removed per new top-right logout button */}

        <h1 className="text-2xl font-bold mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
          SoulSeam Admin
        </h1>

        <nav className="space-y-3">
          {menu.map((item, idx) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="w-full text-left px-4 py-3 rounded-xl bg-white text-black hover:bg-gray-100 transition font-semibold animate-fade-in-up"
              style={{
                animationDelay: `${0.25 + idx * 0.07}s`,
                animationFillMode: "forwards",
              }}
            >
              {item.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      {/* Fade in main content after sidebar is in */}
      <main
        className="flex-1 p-10 bg-gradient-to-br from-black via-[#201134] to-fuchsia-950 animate-fade-in-up"
        style={{ animationDelay: "0.32s", animationFillMode: "forwards" }}
      >
        {children}
      </main>

    </div>
  );
}
