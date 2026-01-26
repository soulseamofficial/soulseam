"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* -------- Mouse tracking glow -------- */
  const [pos, setPos] = useState({ x: 50, y: 50 });

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  }

  /* -------- Click SOUL effect -------- */
  const [souls, setSouls] = useState([]);

  function handleClickEffect(e) {
    // inputs / buttons click ignore
    if (e.target.closest("input") || e.target.closest("button")) return;

    const id = Date.now();

    setSouls(prev => [
      ...prev,
      {
        id,
        x: e.clientX,
        y: e.clientY,
      },
    ]);

    setTimeout(() => {
      setSouls(prev => prev.filter(s => s.id !== id));
    }, 1800);
  }

  /* -------- Login -------- */
  async function handleLogin() {
    if (!identifier) {
      alert("Enter Email or Phone number");
      return;
    }

    const isPhone = /^\d{10}$/.test(identifier);

    if (isPhone) {
      alert("OTP login will be handled here");
      return;
    }

    if (!password) {
      alert("Password required");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/email/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      router.push("/");
    } else {
      alert(data.message);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden"
      onClick={handleClickEffect}
    >
      {/* BACKGROUND */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-[#111] to-black -z-10" />

      {/* CLICK SOUL TEXT */}
      {souls.map(s => (
        <span
          key={s.id}
          className="soul-click"
          style={{ left: s.x, top: s.y }}
        >
          SOUL
        </span>
      ))}

      {/* LOGIN CARD */}
      <div
        onMouseMove={handleMouseMove}
        className="relative w-full max-w-md rounded-3xl border border-white/15 bg-black/80 backdrop-blur-xl p-10 shadow-[0_30px_120px_rgba(255,255,255,0.18)] transition-all duration-300"
        style={{
          backgroundImage: `
            radial-gradient(
              circle at ${pos.x}% ${pos.y}%,
              rgba(255,255,255,0.18),
              rgba(0,0,0,0.9) 60%
            )
          `,
        }}
      >
        {/* glow outline */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/10" />

        <h1 className="text-3xl font-extrabold text-center mb-8 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent tracking-widest">
          LOGIN
        </h1>

        <div className="space-y-5">
          <input
            type="text"
            placeholder="Email / Phone number"
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-2xl px-4 py-3 bg-black/70 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition"
          />

          <input
            type="password"
            placeholder="Password (email login)"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl px-4 py-3 bg-black/70 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-4 py-3 rounded-full font-extrabold tracking-widest text-black bg-gradient-to-r from-white to-zinc-200 hover:scale-[1.05] transition-all shadow-[0_15px_40px_rgba(255,255,255,0.2)] disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        <p className="text-center text-sm text-white/60 mt-8">
          New user?{" "}
          <span
            onClick={() => router.push("/register")}
            className="font-bold text-white cursor-pointer underline"
          >
            Register
          </span>
        </p>

        <p className="text-center text-sm text-white/50 mt-3">
          Forgot password?{" "}
          <span
            className="underline cursor-pointer"
            onClick={async () => {
              if (!identifier || !identifier.includes("@")) {
                alert("Enter your registered email first");
                return;
              }

              const res = await fetch("/api/auth/email/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: identifier }),
              });

              const data = await res.json();
              alert(data.message);
            }}
          >
            Reset here
          </span>
        </p>
      </div>

      {/* GLOBAL STYLES */}
      <style jsx global>{`
        .soul-click {
          position: fixed;
          transform: translate(-50%, -50%);
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.45em;
          color: white;
          pointer-events: none;
          opacity: 0;
          animation: soulBurst 1.8s ease-out forwards;
          text-shadow: 0 0 22px rgba(255,255,255,0.4);
        }

        @keyframes soulBurst {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.6);
          }
          25% {
            opacity: 1;
            transform: translate(-50%, -60%) scale(1.15);
          }
          60% {
            opacity: 0.85;
            transform: translate(-50%, -85%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -120%) scale(0.95);
          }
        }
      `}</style>
    </div>
  );
}
