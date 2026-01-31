"use client";

import { useEffect, useState } from "react";
import AdminConfirmModal from "@/app/components/AdminConfirmModal";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxDiscount: "",
    expiryDate: "",
    isActive: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🔥 delete modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  /* FETCH COUPONS */
  async function fetchCoupons() {
    try {
      const res = await fetch("/api/admin/coupons", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCoupons(data);
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
    }
  }

  useEffect(() => {
    async function loadCoupons() {
      await fetchCoupons();
    }
    loadCoupons();
  }, []);

  /* SAVE COUPON */
  async function save(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.code || !form.discountValue || !form.expiryDate) {
      setError("Code, discount value, and expiry date are required");
      return;
    }

    if (form.discountType === "percentage" && (form.discountValue < 0 || form.discountValue > 100)) {
      setError("Percentage discount must be between 0 and 100");
      return;
    }

    if (form.discountType === "flat" && form.discountValue < 0) {
      setError("Flat discount must be >= 0");
      return;
    }

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          discountValue: parseFloat(form.discountValue),
          minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
          maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to create coupon");
        return;
      }

      setSuccess("Coupon created successfully!");
      setForm({
        code: "",
        discountType: "percentage",
        discountValue: "",
        minOrderAmount: "",
        maxDiscount: "",
        expiryDate: "",
        isActive: true,
      });
      fetchCoupons();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to create coupon");
      console.error(err);
    }
  }

  /* TOGGLE COUPON ACTIVE STATUS */
  async function toggleActive(couponId, currentStatus) {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: couponId,
          isActive: !currentStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to update coupon");
        return;
      }

      fetchCoupons();
    } catch (err) {
      setError("Failed to update coupon");
      console.error(err);
    }
  }

  /* CONFIRM DELETE */
  async function handleConfirmDelete() {
    try {
      const res = await fetch(`/api/admin/coupons?id=${selectedId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        setError("Failed to delete coupon");
        return;
      }

      setConfirmOpen(false);
      setSelectedId(null);
      fetchCoupons();
    } catch (err) {
      setError("Failed to delete coupon");
      console.error(err);
    }
  }

  return (
    <div className="px-8 py-10">
      {/* HEADER */}
      <h1 className="text-3xl font-bold text-white mb-10">
        Coupons
      </h1>

      {/* ERROR/SUCCESS MESSAGES */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 rounded-xl bg-green-500/20 border border-green-500/50 text-green-300">
          {success}
        </div>
      )}

      {/* ADD COUPON CARD */}
      <div
        className="
          relative overflow-hidden
          max-w-5xl
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
          onSubmit={save}
          className="relative z-10 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Coupon Code *</label>
              <input
                placeholder="e.g., SAVE20"
                value={form.code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-black/40 border border-white/15
                  text-white placeholder-white/40
                  focus:outline-none focus:border-white/30
                "
                required
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Discount Type *</label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value })
                }
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-black/40 border border-white/15
                  text-white
                  focus:outline-none focus:border-white/30
                "
                required
              >
                <option value="percentage">Percentage</option>
                <option value="flat">Flat Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">
                Discount Value * {form.discountType === "percentage" ? "(%)" : "(₹)"}
              </label>
              <input
                type="number"
                min="0"
                max={form.discountType === "percentage" ? "100" : undefined}
                step="0.01"
                placeholder={form.discountType === "percentage" ? "e.g., 15" : "e.g., 500"}
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: e.target.value })
                }
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-black/40 border border-white/15
                  text-white placeholder-white/40
                  focus:outline-none focus:border-white/30
                "
                required
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Min Order Amount (₹) - Optional</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 1000"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm({ ...form, minOrderAmount: e.target.value })
                }
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-black/40 border border-white/15
                  text-white placeholder-white/40
                  focus:outline-none focus:border-white/30
                "
              />
            </div>

            {form.discountType === "percentage" && (
              <div>
                <label className="block text-white/70 text-sm mb-2">Max Discount (₹) - Optional</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 500"
                  value={form.maxDiscount}
                  onChange={(e) =>
                    setForm({ ...form, maxDiscount: e.target.value })
                  }
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-black/40 border border-white/15
                    text-white placeholder-white/40
                    focus:outline-none focus:border-white/30
                  "
                />
              </div>
            )}

            <div>
              <label className="block text-white/70 text-sm mb-2">Expiry Date *</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm({ ...form, expiryDate: e.target.value })
                }
                min={new Date().toISOString().split('T')[0]}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-black/40 border border-white/15
                  text-white
                  focus:outline-none focus:border-white/30
                "
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-white/70">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="w-4 h-4 rounded"
              />
              <span>Active</span>
            </label>

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
          </div>
        </form>
      </div>

      {/* COUPONS LIST */}
      <div className="max-w-5xl space-y-6">
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
              <span className="font-bold tracking-wide text-lg">
                {c.code}
              </span>

              <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-sm font-semibold">
                {c.discountType === "percentage" 
                  ? `${c.discountValue}%` 
                  : `₹${c.discountValue}`}
              </span>

              {c.minOrderAmount && (
                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
                  Min: ₹{c.minOrderAmount}
                </span>
              )}

              {c.discountType === "percentage" && c.maxDiscount && (
                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
                  Max: ₹{c.maxDiscount}
                </span>
              )}

              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expiryDate = new Date(c.expiryDate);
                expiryDate.setHours(0, 0, 0, 0);
                const isExpired = expiryDate < today;
                const isActive = c.isActive === true && !isExpired;
                
                return (
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                    isActive
                      ? "bg-green-500/20 border border-green-500/50 text-green-300" 
                      : isExpired
                      ? "bg-orange-500/20 border border-orange-500/50 text-orange-300"
                      : "bg-red-500/20 border border-red-500/50 text-red-300"
                  }`}>
                    {isActive ? "Active" : isExpired ? "Expired" : "Inactive"}
                  </span>
                );
              })()}

              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
                Exp: {new Date(c.expiryDate).toLocaleDateString()}
              </span>
            </div>

            <div className="relative z-10 flex items-center gap-2">
              <button
                onClick={() => toggleActive(c._id, c.isActive)}
                className={`
                  px-4 py-1.5 rounded-xl border text-sm font-semibold transition
                  ${c.isActive
                    ? "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                    : "border-green-500/50 text-green-400 hover:bg-green-500/10"
                  }
                `}
              >
                {c.isActive ? "Disable" : "Enable"}
              </button>

              <button
                onClick={() => {
                  setSelectedId(c._id);
                  setConfirmOpen(true);
                }}
                className="
                  px-4 py-1.5 rounded-xl
                  border border-rose-500/50
                  text-rose-400
                  hover:bg-rose-500/10
                  transition text-sm font-semibold
                "
              >
                Delete
              </button>
            </div>
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
