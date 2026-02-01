"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "../../components/Toast";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [pos, setPos] = useState({ x: 50, y: 50 });

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  }

  const [souls, setSouls] = useState([]);

  function handleClickEffect(e) {
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

  async function handleLogin() {
    if (!identifier) {
      showToast("Enter Email or Phone number", "error");
      return;
    }

    if (!password) {
      showToast("Password required", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        showToast("Login successful", "success");
        router.push("/profile");
      } else {
        showToast(data.message || "Login failed", "error");
      }
    } catch (err) {
      setLoading(false);
      showToast("Network error. Please try again.", "error");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden"
      onClick={handleClickEffect}
    >
      <div className="fixed inset-0 bg-gradient-to-br from-black via-[#111] to-black -z-10" />

      {souls.map(s => (
        <span
          key={s.id}
          className="soul-click"
          style={{ left: s.x, top: s.y }}
        >
          SOUL
        </span>
      ))}

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

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (email login)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setShowPassword(true)}
              onBlur={() => setShowPassword(false)}
              onMouseEnter={() => setShowPassword(true)}
              onMouseLeave={() => setShowPassword(false)}
              className="w-full rounded-2xl px-4 py-3 pr-12 bg-black/70 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition"
            />
            <div
              className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ${
                showPassword
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-75"
              }`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/60"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
          </div>

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