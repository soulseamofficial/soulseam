"use client";

import { useCart } from "@/app/CartContext";
import { useState, useEffect } from "react";

export default function CheckoutPage() {
  const { cartItems, subtotal, clearCart } = useCart();

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("online");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ SAFE localStorage access
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("soulseam_token"));
  }, []);

  const handlePayment = async () => {
    if (!address.name || !address.phone || !address.address) {
      alert("Please fill address");
      return;
    }

    if (paymentMethod === "cod") {
      alert("Order placed successfully (COD)");
      clearCart();
      return;
    }

    setLoading(true);

    // 1️⃣ Create order
    const res = await fetch("/api/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: subtotal })
    });

    const data = await res.json();

    // 2️⃣ Razorpay popup
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: data.amount,
      currency: "INR",
      name: "SOULSEAM",
      description: "Order Payment",
      order_id: data.orderId, // ✅ FIXED
      handler: function (response) {
        alert("Payment Successful");
        clearCart();
      },
      prefill: {
        name: address.name,
        contact: address.phone
      },
      theme: { color: "#000000" }
    };
    

    const razorpay = new window.Razorpay(options);
    razorpay.open();

    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      <input
        placeholder="Name"
        onChange={(e) => setAddress({ ...address, name: e.target.value })}
      />
      <input
        placeholder="Phone"
        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
      />
      <input
        placeholder="Address"
        onChange={(e) => setAddress({ ...address, address: e.target.value })}
      />

      <div className="mt-4">
        <label>
          <input
            type="radio"
            checked={paymentMethod === "online"}
            onChange={() => setPaymentMethod("online")}
          />
          Online Payment
        </label>

        <label className="ml-4">
          <input
            type="radio"
            checked={paymentMethod === "cod"}
            onChange={() => setPaymentMethod("cod")}
          />
          Cash on Delivery
        </label>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="mt-6 bg-black text-white px-6 py-3"
      >
        {loading ? "Processing..." : `Pay ₹${subtotal}`}
      </button>
    </div>
  );
}


