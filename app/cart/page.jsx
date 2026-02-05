"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../CartContext";
import { X, Plus, Minus, MessageCircle, Heart } from "lucide-react";
import Image from "next/image";
import { showToast } from "../components/Toast";

export default function CartPage() {
  const { cartItems, removeItem, updateQuantity, orderMessage, setOrderMessage } = useCart();
  const router = useRouter();

  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageInput, setMessageInput] = useState(orderMessage || "");

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const discount =
    couponApplied && coupon.trim().toUpperCase() === "PREMIUM15"
      ? subtotal * 0.15
      : 0;

  const total = subtotal - discount;

  const handleSaveMessage = () => {
    if (messageInput.trim().length > 250) {
      showToast("Message must be 250 characters or less", "error");
      return;
    }
    setOrderMessage(messageInput.trim());
    setShowMessageModal(false);
    showToast("Message added to your order ✅", "success");
  };

  const handleCancelMessage = () => {
    setMessageInput(orderMessage || "");
    setShowMessageModal(false);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="px-4 sm:px-6 lg:px-20 py-8 sm:py-14">

        {/* Mobile: Back button */}
        <button
          onClick={() => router.push("/")}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 mb-4"
          aria-label="Go back to home"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Desktop: Back button */}
        <button
          onClick={() => router.push("/")}
          className="hidden md:flex group relative px-6 py-3 rounded-full bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-white/15 text-white/90 font-semibold tracking-wide overflow-hidden transition-all duration-300 ease-in-out cursor-pointer hover:border-white/30 hover:text-white active:scale-[0.97] mb-4"
          style={{
            fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
            boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)'
          }}
        >
          <span className="relative z-10 flex items-center transition-all duration-300 ease-in-out">
            <svg width="16" height="16" fill="none" className="mr-2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </span>
          <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
            <span className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent rounded-full"></span>
          </span>
        </button>

        {/* HEADER */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[0.18em] bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent select-none mb-2">
          SOUL CART
        </h1>

        <div className="text-xs sm:text-sm text-white/50 mb-8 tracking-widest">
          <span className="text-white">CART</span> — INFORMATION — SHIPPING — PAYMENT
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-white/10 rounded-2xl bg-gradient-to-br from-[#181818] to-[#0c0c0c] shadow-[0_10px_32px_rgba(255,255,255,0.1)]">
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
              className="px-6 py-3 rounded-full bg-white text-black font-bold active:scale-[0.97] transition"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-6 sm:gap-10">

            {/* LEFT — CART */}
            <div
              className={`
              bg-gradient-to-br from-[#191919] to-[#0b0b0b]
              border border-white/15 rounded-2xl
              p-5 sm:p-8 space-y-6
              shadow-[0_15px_46px_rgba(255,255,255,0.10)]
              transition-all duration-200 ease-out
            
              md:hover:border-white/30
              md:hover:shadow-[0_25px_80px_rgba(255,255,255,0.18)]
              md:hover:-translate-y-1
            
              active:bg-white/5
            `}
            
            >
              <h2 className="text-lg sm:text-xl font-bold tracking-wide">
                MY PICS
              </h2>

              {cartItems.map((item) => (
                <div
                  key={item.id + item.size}
                  className={`
                  flex items-center gap-3 sm:gap-4
                  bg-black/60 border border-white/10
                  rounded-xl p-3 sm:p-4
                  w-full
                  transition-all duration-150 ease-out
                
                  md:hover:border-white/30
                  md:hover:shadow-[0_10px_35px_rgba(255,255,255,0.15)]
                  md:hover:bg-black/70
                
                  active:bg-white/10
                  active:scale-[0.985]
                `}
                
                >
                  {/* IMAGE */}
                  <div className="w-14 h-14 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border border-white/10">
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
                    <div className={`
                      flex items-center gap-1.5
                      border border-white/20 rounded-full
                      px-2.5 py-1
                      bg-black/30
                    `}>
                      <button
                        onClick={() =>
                          item.quantity > 1 &&
                          updateQuantity(item.id, item.size, -1)
                        }
                        className={`
                          p-1 rounded-full
                          active:bg-white/15
                          md:hover:bg-white/10
                        `}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xs min-w-[16px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.size, 1)
                        }
                        className={`
                          p-1 rounded-full
                          active:bg-white/15
                          md:hover:bg-white/10
                        `}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeItem(item.id, item.size)}
                        className={`
                          text-white/40
                          md:hover:text-white
                          active:opacity-70
                        `}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <Link
                href="/"
                className="inline-block text-xs sm:text-sm text-white/60 md:hover:text-white active:opacity-80"
              >
                ← Continue Shopping
              </Link>
            </div>

            {/* RIGHT — ORDER */}
            <div
              className={`
              bg-[#0b0b0b] border border-white/10
              rounded-2xl sm:rounded-3xl
              p-4 sm:p-8 space-y-5
              shadow-[0_0_80px_rgba(255,255,255,0.05)]
              transition-all duration-200 ease-out
            
              md:hover:border-white/30
              md:hover:shadow-[0_25px_80px_rgba(255,255,255,0.18)]
              md:hover:-translate-y-1
            
              active:bg-white/5
            `}
            
            >
              <h2 className="text-lg sm:text-xl font-semibold tracking-widest">
                YOUR ORDER
              </h2>

              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Gift card or discount code"
                  className={`
                    flex-1 bg-black/70 border border-white/15
                    rounded-full px-4 py-3 text-xs sm:text-sm
                    outline-none focus:border-white/40
                  `}
                />
                <button
                  onClick={() => setCouponApplied(true)}
                  className={`
                    px-5 rounded-full bg-white text-black font-semibold
                    text-xs sm:text-sm
                    active:bg-white/90
                    md:hover:scale-105 transition
                  `}
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

              {/* Add Message Button */}
              <button
                onClick={() => setShowMessageModal(true)}
                className={`
                  w-full py-3 sm:py-3.5 rounded-full
                  bg-gradient-to-r from-pink-500/20 to-purple-500/20
                  border border-pink-400/30 text-white font-semibold
                  text-sm sm:text-base
                  active:scale-[0.97]
                  md:hover:scale-[1.03] md:hover:shadow-[0_0_20px_rgba(255,105,180,0.4)]
                  transition-all duration-300 ease-out
                  flex items-center justify-center gap-2
                  relative overflow-hidden
                  group
                `}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Heart size={18} className="fill-pink-400 text-pink-400" />
                  Add a Note to Your Loved Ones 💌
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </button>

              {orderMessage && (
                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-400/20">
                  <p className="text-xs text-white/60 mb-1">Your message:</p>
                  <p className="text-sm text-white/90 italic">&quot;{orderMessage}&quot;</p>
                </div>
              )}

              <button
                onClick={() => router.push("/checkout")}
                className={`
                  w-full py-3 sm:py-4 rounded-full
                  bg-white text-black font-semibold
                  active:bg-white/90
                  md:hover:scale-105 transition
                  min-h-[44px]
                `}
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

      {/* Message Modal */}
      {showMessageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && handleCancelMessage()}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
          
          {/* Modal */}
          <div
            className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/20 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_25px_80px_rgba(255,255,255,0.15)] animate-modal-open"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCancelMessage}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Add a Personal Message
              </h3>
              <p className="text-sm text-white/60">
                This message will be included with your order
              </p>
            </div>

            <textarea
              value={messageInput}
              onChange={(e) => {
                if (e.target.value.length <= 250) {
                  setMessageInput(e.target.value);
                }
              }}
              placeholder="Write your message here… (Example: Happy Birthday ❤️)"
              className={`
                w-full h-32 px-4 py-3 rounded-xl
                bg-black/60 border border-white/15
                text-white placeholder:text-white/30
                outline-none focus:border-pink-400/50 focus:ring-2 focus:ring-pink-400/20
                transition-all duration-300
                resize-none
                text-sm
              `}
              maxLength={250}
            />

            <div className="flex justify-end mt-2 mb-6">
              <span className="text-xs text-white/50">
                {messageInput.length}/250 characters
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelMessage}
                className={`
                  flex-1 py-3 rounded-xl
                  border border-white/20 text-white font-semibold
                  hover:bg-white/10 active:scale-[0.97]
                  transition-all duration-200
                `}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMessage}
                className={`
                  flex-1 py-3 rounded-xl
                  bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold
                  hover:from-pink-600 hover:to-purple-600
                  active:scale-[0.97]
                  transition-all duration-200
                  shadow-lg shadow-pink-500/30
                `}
              >
                Save Message
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modal-open {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modal-open {
          animation: modal-open 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
