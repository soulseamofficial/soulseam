"use client";

import { useState } from "react";
import { useCart } from "../CartContext";
import Link from "next/link";
import { ArrowRight, Plus, Minus, X } from "lucide-react";

export default function CartPage() {
  const { cartItems, updateQuantity, removeItem, subtotal } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(false);
  const [showCouponSuccess, setShowCouponSuccess] = useState(false);

  const shipping = subtotal > 100 ? 0 : 9.99;
  const discount = appliedCoupon ? subtotal * 0.15 : 0;
  const total = subtotal + shipping - discount;

  function applyCoupon(e) {
    e.preventDefault();
    if (appliedCoupon) return;

    if (couponCode.trim().toUpperCase() === "PREMIUM15") {
      setAppliedCoupon(true);
      setShowCouponSuccess(true);
      setTimeout(() => setShowCouponSuccess(false), 1800);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 md:px-8 animate-fadeIn">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-wider mb-3 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
            Your Shopping Cart
          </h1>
          <div className="text-sm text-white/50">
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>{" "}
            / Cart
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-6 mt-4">
          {/* LEFT */}
          <div className="premium-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-6">
              Cart Items ({cartItems.length})
            </h2>

            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
                <img
                  src="/empty-cart.svg"
                  alt="Empty Cart"
                  className="w-28 h-28 mb-6 opacity-70 invert"
                />
                <p className="text-white/60 font-semibold">
                  Your cart is empty
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="flex justify-between items-center border-b border-white/10 pb-4 group transition-all hover:scale-[1.01]"
                  >
                    <div className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover group-hover:scale-105 transition"
                      />
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-white/50 text-sm">
                          Size: {item.size} | Color: {item.color}
                        </p>
                        <p className="text-white/70 text-sm">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.size, -1)
                        }
                        className="icon-btn"
                      >
                        <Minus size={16} />
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.size, 1)
                        }
                        className="icon-btn"
                      >
                        <Plus size={16} />
                      </button>

                      <button
                        onClick={() =>
                          removeItem(item.id, item.size)
                        }
                        className="icon-btn text-red-400"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COUPON */}
            <form onSubmit={applyCoupon} className="mt-8 flex gap-3">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon code"
                className="flex-1 rounded-xl bg-black border border-white/15 px-4 py-2 text-white focus:border-white/40 focus:ring-2 focus:ring-white/20 transition"
              />
              <button
                type="submit"
                disabled={appliedCoupon}
                className="px-5 py-2 rounded-xl bg-white text-black font-bold hover:scale-105 transition disabled:opacity-50"
              >
                Apply
              </button>
            </form>

            {showCouponSuccess && (
              <p className="text-green-400 mt-2 font-semibold animate-pulse">
                Coupon applied!
              </p>
            )}
          </div>

          {/* RIGHT */}
          <div className="premium-card p-6 sm:p-8 sticky top-24">
            <h2 className="text-xl font-semibold mb-6">
              Order Summary
            </h2>

            <div className="space-y-4 text-white/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : `$${shipping}`}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>- ${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-white/10 pt-4 flex justify-between text-lg font-extrabold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={cartItems.length === 0}
              onClick={() => {
                if (cartItems.length > 0) {
                  window.location.href = "/checkout";
                }
              }}
              className={`w-full mt-6 py-3 rounded-full font-extrabold flex items-center justify-center gap-2 transition-all ${
                cartItems.length === 0
                  ? "bg-white/20 text-white/40 cursor-not-allowed"
                  : "bg-white text-black hover:scale-105 hover:shadow-[0_20px_50px_rgba(255,255,255,0.25)]"
              }`}
            >
              Finish the Stitch <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* GLOBAL STYLES */}
      <style jsx global>{`
        .premium-card {
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0.08),
            rgba(0,0,0,0.6)
          );
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 1.25rem;
          box-shadow: 0 25px 90px rgba(255,255,255,0.12);
          backdrop-filter: blur(16px);
          transition: all .4s cubic-bezier(.4,0,.2,1);
        }
        .premium-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 35px 120px rgba(255,255,255,0.18);
          border-color: rgba(255,255,255,0.35);
        }
        .icon-btn {
          padding: 6px;
          border-radius: 999px;
          transition: all .25s;
        }
        .icon-btn:hover {
          background: rgba(255,255,255,0.15);
          transform: scale(1.15);
        }
        .animate-fadeIn {
          animation: fadeIn .6s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
