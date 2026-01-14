"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "../CartContext";
import { X, Plus, Minus } from "lucide-react";

export default function CartPage() {
  const { cartItems, removeItem, updateQuantity } = useCart();

  const getSubtotal = () =>
    cartItems.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );

  const getTotalItems = () =>
    cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);

  const shippingCost = 0;
  const total = getSubtotal() + shippingCost;

  return (
    <div className="min-h-screen bg-black text-white py-10 px-4 sm:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-white/60 flex items-center gap-1">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Cart</span>
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold mb-1">
            Your Shopping Cart
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/10 bg-white/5 mt-4">
            <img
              src="/empty-cart.svg"
              alt="Empty Cart"
              className="w-28 h-28 mb-6 opacity-80"
              style={{ filter: "invert(1)" }}
            />
            <div className="text-lg mb-3 font-medium text-white/90">
              Your cart is empty.
            </div>
            <Link
              href="/"
              className="mt-2 px-8 py-3 rounded-full bg-white text-black font-semibold text-base shadow-sm hover:bg-gray-200 transition-colors"
            >
              Go to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-6 mt-4">
            {/* Items column */}
            <div className="bg-[#080d1a] border border-white/10 rounded-2xl shadow-xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5">
                    🛍️
                  </span>
                  <span className="font-semibold text-lg">
                    Items ({getTotalItems()})
                  </span>
                </div>
                <div className="text-sm text-white/60">
                  Total:{" "}
                  <span className="font-semibold text-white">
                    ₹{getSubtotal().toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id + (item.size || "")}
                    className="flex items-center gap-4 rounded-xl bg-[#0d1424] border border-white/10 px-4 py-4"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-base sm:text-lg mb-1 text-white">
                        {item.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-white/60 mb-1">
                        Size: {item.size} | Color: {item.color || "Black"}
                      </p>
                      <p className="text-xs sm:text-sm text-white/60">
                        Price: ₹{Number(item.price).toLocaleString()} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 border border-white/20 rounded-lg px-2 py-1">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() =>
                          item.quantity > 1
                            ? updateQuantity(item.id, item.size, -1)
                            : null
                        }
                        disabled={item.quantity <= 1}
                        className="h-7 w-7 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        type="button"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-[28px] text-center font-medium text-sm">
                        {item.quantity}
                      </span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() =>
                          updateQuantity(item.id, item.size, 1)
                        }
                        className="h-7 w-7 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
                        type="button"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Price and Remove */}
                    <div className="flex flex-col items-end gap-2 min-w-[100px]">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-base sm:text-lg text-white">
                          ₹{(Number(item.price) * Number(item.quantity)).toLocaleString()}
                        </span>
                        <span className="text-xs text-white/60">
                          ₹{Number(item.price).toLocaleString()} each
                        </span>
                      </div>
                      <button
                        aria-label="Remove item"
                        onClick={() => removeItem(item.id, item.size)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        type="button"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 bg-transparent text-white text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Summary column */}
            <div className="bg-[#080d1a] border border-white/10 rounded-2xl shadow-xl p-6 sm:p-7 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">Order Summary</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Subtotal</span>
                  <span>₹{getSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Shipping</span>
                  <span className="text-green-400">FREE</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎟️</span>
                  <label className="text-sm font-medium text-white/90">
                    Apply Coupon
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code: PREMIUM15"
                    className="flex-1 rounded-full bg-black/40 border border-white/15 px-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/40"
                  />
                  <button
                    type="button"
                    className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="w-full mt-2 py-3 rounded-full bg-white text-black font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
              >
                Proceed to Checkout
                <span>→</span>
              </button>

              <div className="mt-4 space-y-2 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <span>Secure checkout &amp; SSL encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Free shipping on orders over ₹100</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Multiple payment options</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
