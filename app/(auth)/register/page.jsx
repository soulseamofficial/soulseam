"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({});
  }

  function validate() {
    const e = {};

    if (!form.firstName) e.firstName = true;
    if (!form.lastName) e.lastName = true;

    if (!/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(form.email)) e.email = true;
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = true;

    if (!form.password || form.password.length < 6) e.password = true;
    if (form.password !== form.confirmPassword) e.confirmPassword = true;

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const res = await fetch("/api/auth/email/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      alert("Account created successfully");
      router.push("/login");
    } else {
      alert(data.message || "Registration failed");
    }
  }

  const fieldClass = (err) =>
    `w-full rounded-2xl px-4 py-3 bg-black/85 border ${
      err ? "border-white/40" : "border-white/15"
    } text-white font-semibold placeholder:text-white/35 transition-all duration-300 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      {/* Top glow */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.95) 55%)",
        }}
      />

      <div
        className={`w-full max-w-md rounded-3xl bg-gradient-to-b from-white/10 via-black/30 to-black border border-white/15 backdrop-blur-xl p-10 shadow-[0_25px_90px_rgba(255,255,255,0.18)] animate-reveal`}
      >
        <h1 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-transparent tracking-widest">
          Create Account
        </h1>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="flex gap-3">
            <input
              name="firstName"
              placeholder="First name"
              value={form.firstName}
              onChange={handleChange}
              className={fieldClass(errors.firstName)}
            />
            <input
              name="lastName"
              placeholder="Last name"
              value={form.lastName}
              onChange={handleChange}
              className={fieldClass(errors.lastName)}
            />
          </div>

          <input
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            className={fieldClass(errors.email)}
          />

          <input
            name="phone"
            placeholder="Phone number"
            value={form.phone}
            onChange={handleChange}
            className={fieldClass(errors.phone)}
          />

          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={form.password}
            onChange={handleChange}
            className={fieldClass(errors.password)}
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={handleChange}
            className={fieldClass(errors.confirmPassword)}
          />

          {errors.confirmPassword && (
            <p className="text-sm text-rose-400 font-semibold">
              Passwords do not match
            </p>
          )}

          <button
            disabled={loading}
            className="w-full mt-4 py-3 rounded-full font-extrabold tracking-widest text-black bg-gradient-to-r from-white to-zinc-200 shadow-[0_12px_36px_rgba(255,255,255,0.15)] hover:scale-[1.04] transition-all disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white/60">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-white font-bold underline cursor-pointer"
          >
            Login
          </span>
        </p>
      </div>

      <style jsx global>{`
        .animate-reveal {
          animation: reveal 0.9s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes reveal {
          from {
            opacity: 0;
            transform: scale(0.97) translateY(28px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}