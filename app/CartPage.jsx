"use client";

import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Minus, Tag, ArrowRight, Shield, Truck, CreditCard } from 'lucide-react';
import { useCart } from '../CartContext'; // Adjusted path
import Link from "next/link";
import { useRouter } from "next/navigation";

const CartPage = () => {
  const { cartItems, updateQuantity, removeItem, subtotal } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(false);
  const [showCouponSuccess, setShowCouponSuccess] = useState(false);
  const router = useRouter();

  const shipping = subtotal > 100 ? 0 : 9.99;
  const discount = appliedCoupon ? subtotal * 0.15 : 0;
  const total = subtotal + shipping - discount;

  const applyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'PREMIUM15') {
      setAppliedCoupon(true);
      setShowCouponSuccess(true);
      setTimeout(() => setShowCouponSuccess(false), 3000);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      router.push('/checkout');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-light tracking-wider mb-4">Your Shopping Cart</h1>
          <div className="flex items-center space-x-2 text-gray-400">
            <Link href="/" className="hover:text-white transition-colors duration-300">Home</Link>
            <span>/</span>
            <span className="text-white">Cart</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-xl p-6 mb-6 transform transition-all duration-500 hover:shadow-2xl hover:shadow-gray-800/30">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light">Cart Items ({cartItems.length})</h2>
              </div>
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex items-center justify-between border-b border-gray-800 py-4">
                  {/* Item details */}
                  <div className="flex items-center space-x-4">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-gray-400">Size: {item.size} | Color: {item.color}</p>
                      <p className="text-gray-400">${item.price.toFixed(2)} x {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button onClick={() => updateQuantity(item.id, item.size, -1)}><Minus size={18} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.size, 1)}><Plus size={18} /></button>
                    <button onClick={() => removeItem(item.id, item.size)}><X size={18} className="text-red-500" /></button>
                  </div>
                </div>
              ))}
            </div>
            {/* Coupon section */}
            <div className="bg-gray-900 rounded-xl p-6 transform transition-all duration-500 hover:shadow-2xl hover:shadow-gray-800/30">
              <h3 className="text-lg font-light mb-4">Apply Coupon</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded"
                  placeholder="Enter code"
                />
                <button onClick={applyCoupon} className="px-4 py-2 bg-white text-black rounded">Apply</button>
              </div>
              {showCouponSuccess && <p className="text-green-400 mt-2">Coupon applied!</p>}
            </div>
            {/* Estimated Delivery */}
            <div className="bg-gray-900 rounded-xl p-6 mt-6 transform transition-all duration-500 hover:shadow-2xl hover:shadow-gray-800/30">
              <h3 className="text-lg font-light mb-4">Estimated Delivery</h3>
              <p className="text-gray-400 mb-2">2-4 business days</p>
              <p className="text-sm text-gray-500">Express shipping available at checkout</p>
            </div>
          </div>
          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-gray-900 rounded-xl p-6 transform transition-all duration-500 hover:shadow-2xl hover:shadow-gray-800/30">
                <h2 className="text-2xl font-light mb-6">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xl border-t border-gray-800 pt-4">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={handleCheckout} className="w-full mt-6 py-3 bg-white text-black rounded-full font-semibold">
                  Proceed to Checkout <ArrowRight className="inline ml-2" size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;