"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../CartContext";
import { X, Plus, Minus } from "lucide-react";
import Image from "next/image";

export default function CartPage() {
  const { cartItems, removeItem, updateQuantity } = useCart();
  const router = useRouter();

  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const discount =
    couponApplied && coupon.trim().toUpperCase() === "PREMIUM15"
      ? subtotal * 0.15
      : 0;

  const total = subtotal - discount;

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="px-4 sm:px-6 lg:px-20 py-8 sm:py-14">

        {/* HEADER */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[0.18em]
                       bg-gradient-to-r from-white to-neutral-400
                       bg-clip-text text-transparent select-none mb-2">
          SOUL CART
        </h1>

        <div className="text-xs sm:text-sm text-white/50 mb-8 tracking-widest">
          <span className="text-white">CART</span> — INFORMATION — SHIPPING — PAYMENT
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24
                          border border-white/10 rounded-2xl
                          bg-gradient-to-br from-[#181818] to-[#0c0c0c]
                          shadow-[0_10px_32px_rgba(255,255,255,0.1)]">
            <Image
              src="/empty-cart.svg"
              alt="Empty Cart"
              width={90}
              height={90}
              className="mb-6 opacity-80"
              style={{ filter: "invert(1)" }}
            />
            <p className="text-white/70 mb-4">Your cart is empty</p>
            <Link
              href="/"
              className="px-6 py-3 rounded-full bg-white text-black font-bold
                         active:scale-[0.97] transition"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-6 sm:gap-10">

            {/* LEFT — CART */}
            <div
              className="
              bg-gradient-to-br from-[#191919] to-[#0b0b0b]
              border border-white/15 rounded-2xl
              p-5 sm:p-8 space-y-6
              shadow-[0_15px_46px_rgba(255,255,255,0.10)]
              transition-all duration-200 ease-out
            
              md:hover:border-white/30
              md:hover:shadow-[0_25px_80px_rgba(255,255,255,0.18)]
              md:hover:-translate-y-1
            
              active:bg-white/5
            "
            
            >
              <h2 className="text-lg sm:text-xl font-bold tracking-wide">
                MY PICS
              </h2>

              {cartItems.map((item) => (
                <div
                  key={item._id + "_" + item.size}
                  className="
                  flex items-center gap-3 sm:gap-4
                  bg-black/60 border border-white/10
                  rounded-xl p-3 sm:p-4
                  w-full
                  transition-all duration-150 ease-out
                
                  /* DESKTOP HOVER */
                  md:hover:border-white/30
                  md:hover:shadow-[0_10px_35px_rgba(255,255,255,0.15)]
                  md:hover:bg-black/70
                
                  /* MOBILE TOUCH FEEDBACK */
                  active:bg-white/10
                  active:scale-[0.985]
                "
                
                >
                  {/* IMAGE */}
                  <div className="w-14 h-14 sm:w-20 sm:h-20 flex-shrink-0
                                  rounded-lg overflow-hidden border border-white/10">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                      draggable={false}
                    />
                  </div>

                  {/* DETAILS */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] sm:text-xs text-white/50">
                      {item.color || "Black"} / {item.size}
                    </p>
                    <p className="text-xs sm:text-sm mt-1">
                      ₹{item.price}
                    </p>
                  </div>

                  {/* QTY + PRICE */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="
                      flex items-center gap-1.5
                      border border-white/20 rounded-full
                      px-2.5 py-1
                      bg-black/30
                    ">
                      <button
                        onClick={() =>
                          item.quantity > 1 &&
                          updateQuantity(item._id, item.size, -1)
                        }
                        className="
                          p-1 rounded-full
                          active:bg-white/15
                          md:hover:bg-white/10
                        "
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xs min-w-[16px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item._id, item.size, 1)
                        }
                        className="
                          p-1 rounded-full
                          active:bg-white/15
                          md:hover:bg-white/10
                        "
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeItem(item._id, item.size)}
                        className="
                          text-white/40
                          md:hover:text-white
                          active:opacity-70
                        "
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <Link
                href="/"
                className="inline-block text-xs sm:text-sm text-white/60
                           md:hover:text-white active:opacity-80"
              >
                ← Continue Shopping
              </Link>
            </div>

            {/* RIGHT — ORDER */}
            <div
              className="
              bg-[#0b0b0b] border border-white/10
              rounded-2xl sm:rounded-3xl
              p-4 sm:p-8 space-y-5
              shadow-[0_0_80px_rgba(255,255,255,0.05)]
              transition-all duration-200 ease-out
            
              md:hover:border-white/30
              md:hover:shadow-[0_25px_80px_rgba(255,255,255,0.18)]
              md:hover:-translate-y-1
            
              active:bg-white/5
            "
            
            >
              <h2 className="text-lg sm:text-xl font-semibold tracking-widest">
                YOUR ORDER
              </h2>

              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Gift card or discount code"
                  className="
                    flex-1 bg-black/70 border border-white/15
                    rounded-full px-4 py-3 text-xs sm:text-sm
                    outline-none focus:border-white/40
                  "
                />
                <button
                  onClick={() => setCouponApplied(true)}
                  className="
                    px-5 rounded-full bg-white text-black font-semibold
                    text-xs sm:text-sm
                    active:bg-white/90
                    md:hover:scale-105 transition
                  "
                >
                  Apply
                </button>
              </div>

              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Discount</span>
                  <span className="text-green-400">
                    -₹{discount.toFixed(0)}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                className="
                  w-full py-3 sm:py-4 rounded-full
                  bg-white text-black font-semibold
                  active:bg-white/90
                  md:hover:scale-105 transition
                  min-h-[44px]
                "
              >
                MAKE IT YOURS →
              </button>

              <p className="text-[11px] sm:text-xs text-white/50 text-center">
                Secure checkout · SSL encrypted
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
