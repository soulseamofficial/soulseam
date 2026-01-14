"use client";

import { useEffect, useState } from "react";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({ code: "", discount: "", expiry: "", active: true });

  async function load() {
    const res = await fetch("/api/admin/coupons");
    setCoupons(await res.json());
  }

  async function save() {
    if (!form.code || !form.discount || !form.expiry) return;

    await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setForm({ code: "", discount: "", expiry: "", active: true });
    load();
  }

  async function remove(id) {
    await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center bg-gradient-to-br from-neutral-950 via-fuchsia-900/40 to-neutral-950">

      <h1 className="text-4xl font-black text-center mb-12 bg-gradient-to-r from-fuchsia-300 via-fuchsia-500 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-lg">
        Coupons
      </h1>

      {/* ===== Add Coupon Section ===== */}
      <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mb-14">

        {/* Input Box */}
        <form
          className="flex-1 flex flex-col md:flex-row gap-4 bg-gradient-to-br from-[#15111e] via-[#261435]/60 to-[#23122b]
          border border-fuchsia-700/30 rounded-xl p-6 shadow-2xl"
          onSubmit={e => { e.preventDefault(); save(); }}
        >
          <input
            placeholder="Code"
            value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="flex-1 rounded-xl border border-fuchsia-500/30 bg-neutral-900 px-5 py-2 text-white placeholder-fuchsia-300 focus:ring-2 focus:ring-fuchsia-400"
          />

          <input
            placeholder="Discount %"
            type="number"
            min="1"
            max="100"
            value={form.discount}
            onChange={e => setForm({ ...form, discount: e.target.value })}
            className="w-32 rounded-xl border border-fuchsia-500/30 bg-neutral-900 px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-400"
          />

          <input
            type="date"
            value={form.expiry}
            onChange={e => setForm({ ...form, expiry: e.target.value })}
            className="rounded-xl border border-fuchsia-500/30 bg-neutral-900 px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-400"
          />
        </form>

        {/* Add Button */}
        <button
          onClick={save}
          className="md:w-40 rounded-xl border border-fuchsia-300/60 px-8 py-3 font-semibold
          text-fuchsia-200 hover:bg-fuchsia-700/20 transition-all shadow-lg"
        >
          + Add Coupon
        </button>
      </div>

      {/* ===== Coupons List ===== */}
      <div className="w-full max-w-3xl flex flex-col gap-4">
        {coupons.length === 0 && (
          <div className="text-fuchsia-300/70 text-center py-12 text-lg font-semibold">
            No coupons yet.
          </div>
        )}

        {coupons.map(c => (
          <div
            key={c._id}
            className="flex justify-between items-center bg-gradient-to-tr from-white/5 via-fuchsia-900/40 to-fuchsia-900/10
            border border-white/10 rounded-xl px-6 py-4 shadow-md"
          >
            <div className="flex flex-wrap items-center gap-3 text-white">
              <span className="font-bold">{c.code}</span>
              <span className="px-2 py-1 bg-fuchsia-900 rounded text-fuchsia-200">{c.discount}%</span>
              <span className="px-2 py-1 bg-white/10 rounded">
                Exp: {new Date(c.expiry).toLocaleDateString()}
              </span>
            </div>

            <button
              onClick={() => remove(c._id)}
              className="px-3 py-1 text-sm rounded border border-red-700/40 text-red-200
              bg-red-950/50 hover:bg-red-800/70 transition"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
