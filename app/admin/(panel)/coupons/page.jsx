"use client";

import { useEffect, useState } from "react";
import AdminConfirmModal from "@/app/components/AdminConfirmModal";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({
    code: "",
    discount: "",
    expiry: "",
    active: true,
  });

  // 🔥 delete modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  /* FETCH COUPONS */
  async function fetchCoupons() {
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    setCoupons(data);
  }

  useEffect(() => {
    async function loadCoupons() {
      await fetchCoupons();
    }
    loadCoupons();
  }, []);

  /* SAVE COUPON */
  async function save() {
    if (!form.code || !form.discount || !form.expiry) return;

    await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setForm({ code: "", discount: "", expiry: "", active: true });
    fetchCoupons();
  }

  /* CONFIRM DELETE */
  async function handleConfirmDelete() {
    await fetch(`/api/admin/coupons?id=${selectedId}`, {
      method: "DELETE",
    });

    setConfirmOpen(false);
    setSelectedId(null);
    fetchCoupons();
  }

  return (
    <div className="px-8 py-10">
      {/* HEADER */}
      <h1 className="text-3xl font-bold text-white mb-10">
        Coupons
      </h1>

      {/* ADD COUPON CARD */}
      <div
        className="
          relative overflow-hidden
          max-w-4xl
          rounded-3xl
          bg-gradient-to-b from-white/8 via-black/25 to-black
          backdrop-blur-2xl
          border border-white/12
          shadow-[0_18px_70px_rgba(255,255,255,0.14)]
          p-6 mb-14
        "
      >
        {/* TOP LIGHT */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.14)_0%,_rgba(0,0,0,0.92)_55%)]" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="relative z-10 flex flex-wrap gap-4"
        >
          <input
            placeholder="Coupon Code"
            value={form.code}
            onChange={(e) =>
              setForm({
                ...form,
                code: e.target.value.toUpperCase(),
              })
            }
            className="
              flex-1 px-4 py-3 rounded-xl
              bg-black/40 border border-white/15
              text-white placeholder-white/40
              focus:outline-none focus:border-white/30
            "
          />

          <input
            type="number"
            min="1"
            max="100"
            placeholder="Discount %"
            value={form.discount}
            onChange={(e) =>
              setForm({ ...form, discount: e.target.value })
            }
            className="
              w-40 px-4 py-3 rounded-xl
              bg-black/40 border border-white/15
              text-white
              focus:outline-none focus:border-white/30
            "
          />

          <input
            type="date"
            value={form.expiry}
            onChange={(e) =>
              setForm({ ...form, expiry: e.target.value })
            }
            className="
              px-4 py-3 rounded-xl
              bg-black/40 border border-white/15
              text-white
              focus:outline-none focus:border-white/30
            "
          />

          <button
            type="submit"
            className="
              px-8 py-3 rounded-xl
              bg-white/10 border border-white/20
              text-white font-semibold
              hover:bg-white/15 hover:border-white/30
              hover:scale-[1.02]
              transition-all
            "
          >
            + Add Coupon
          </button>
        </form>
      </div>

      {/* COUPONS LIST */}
      <div className="max-w-4xl space-y-6">
        {coupons.length === 0 && (
          <p className="text-white/50 text-center">
            No coupons yet.
          </p>
        )}

        {coupons.map((c) => (
          <div
            key={c._id}
            className="
              relative overflow-hidden
              rounded-2xl
              bg-gradient-to-b from-white/8 via-black/25 to-black
              backdrop-blur-xl
              border border-white/12
              px-6 py-4
              flex flex-wrap justify-between items-center gap-4
              shadow-[0_10px_45px_rgba(255,255,255,0.12)]
            "
          >
            {/* TOP LIGHT */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12)_0%,_rgba(0,0,0,0.9)_55%)]" />

            <div className="relative z-10 flex flex-wrap items-center gap-3 text-white">
              <span className="font-bold tracking-wide">
                {c.code}
              </span>

              <span className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-sm">
                {c.discount}%
              </span>

              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-sm">
                Exp: {new Date(c.expiry).toLocaleDateString()}
              </span>
            </div>

            <button
              onClick={() => {
                setSelectedId(c._id);
                setConfirmOpen(true);
              }}
              className="
                relative z-10
                px-4 py-1.5 rounded-xl
                border border-rose-500/50
                text-rose-400
                hover:bg-rose-500/10
                transition
              "
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* 🔥 CONFIRM MODAL */}
      <AdminConfirmModal
        open={confirmOpen}
        title="Delete this coupon?"
        message="This coupon will be permanently removed."
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
