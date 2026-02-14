"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Add simple fade-in-up animation utility class (from globals.css)
// .animate-fade-in-up { animation: fade-in-up 0.7s ease-out forwards; }

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const menu = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Orders", path: "/admin/orders" },
    { name: "Exchange Orders", path: "/admin/orders/exchanges" },
    { name: "Users", path: "/admin/users" },
    { name: "Guest Users", path: "/admin/guest-users" },
    { name: "Reels", path: "/admin/reels" },
    { name: "Products", path: "/admin/products" },
    { name: "Reviews", path: "/admin/reviews" },
    { name: "Coupons", path: "/admin/coupons" },
    { name: "Settings", path: "/admin/settings" },
  ];

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/stats", {
          credentials: "include",
        });

        if (!res.ok) {
          router.replace("/admin/login");
        } else {
          setChecking(false);
        }
      } catch (err) {
        router.replace("/admin/login");
      }
    }

    checkAuth();
  }, []);

  // ⏳ Prevent UI flash while checking auth
  if (checking) return null; // you can replace with loader

  // 🚪 Logout handler
  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      // ignore error
    }
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-black text-white relative">
      {/* Full screen gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-[#111] to-[#000] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_#111_0%,_#000_60%)] -z-10" />

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="absolute top-5 right-6 z-40 px-5 py-2.5 rounded-full bg-gradient-to-b from-white/10 to-white/0 border border-white/20 backdrop-blur-xl hover:border-white/40 hover:-translate-y-0.5 transition-all duration-300 text-white font-bold text-sm shadow-[0_10px_32px_rgba(255,255,255,0.10)] animate-fade-in-up"
        style={{
          animationDelay: "0.35s",
          animationFillMode: "forwards",
        }}
        aria-label="Logout"
      >
        Logout
      </button>

      {/* Sidebar - Glassmorphism */}
      <aside
        className="w-64 bg-gradient-to-b from-white/10 to-white/0 backdrop-blur-xl border-r border-white/15 p-6 animate-fade-in-up shadow-[0_20px_80px_rgba(255,255,255,0.13)]"
        style={{ animationDelay: "0.10s", animationFillMode: "forwards" }}
      >
       <div className="mb-10 flex justify-center">
  <Image
    src="/logo.jpg"
    alt="SoulSeam Logo"
    width={140}
    height={140}
    priority
    className="
      object-contain
      drop-shadow-[0_4px_18px_rgba(255,255,255,0.25)]
    "
  />
</div>


        <nav className="space-y-3">
          {menu.map((item, idx) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-b from-white/10 to-white/0 border border-white/15 hover:border-white/30 hover:-translate-y-0.5 transition-all duration-300 text-white font-semibold shadow-[0_10px_32px_rgba(255,255,255,0.10)] animate-fade-in-up"
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

      {/* Main content - Centered with max width */}
      <main
        className="flex-1 p-10 animate-fade-in-up overflow-auto"
        style={{ animationDelay: "0.32s", animationFillMode: "forwards" }}
      >
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}