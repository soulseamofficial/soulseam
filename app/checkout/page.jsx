"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "../CartContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

// India states
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
];

// --- Progress Bar ---
const ProgressBar = ({ step }) => {
  const router = useRouter();
  const progress = ["Cart", "Information", "Shipping", "Payment"];

  return (
    <nav aria-label="Progress" className="mb-12 sm:mb-10">
      <ol className="flex items-center text-xs gap-5 sm:gap-4">
        {progress.map((label, idx) => (
          <li key={label} className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (label === "Cart") {
                  router.push("/cart");
                }
              }}
              className={`
                uppercase tracking-widest font-black transition-all duration-600 ease-out
                ${idx <= step
                  ? "text-white"
                  : "text-white/25"}
                ${label === "Cart" ? "cursor-pointer hover:underline" : "cursor-default"}
              `}
            >
              {label}
            </button>
            {idx < progress.length - 1 && (
              <span
                className={`
                  mx-3 w-[14px] h-[2px] rounded-full
                  bg-gradient-to-r from-white/50 via-white/10 to-white/0
                  ${idx < step ? "opacity-90" : "opacity-40"}
                `}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// --- Product card ---
const checkoutProductCardClass = `
  flex items-center mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white/10 to-white/0 group
  border border-white/15
  shadow-[0_20px_80px_rgba(255,255,255,0.13)]
  relative transition-all duration-600 ease-out
  hover:-translate-y-2.5 hover:shadow-[0_32px_100px_rgba(255,255,255,0.19)]
  hover:border-white/25
  will-change-transform
`;

const checkoutProductCardImgClass = `
  w-16 h-16 sm:w-20 sm:h-20 mr-4 shrink-0 relative overflow-hidden rounded-xl
  bg-gradient-to-b from-black/70 via-black/65 to-black/80
  transition-all duration-600 ease-out
`;

function CheckoutProductCard({ item }) {
  return (
    <div
      className={checkoutProductCardClass}
    >
      <div
        className={checkoutProductCardImgClass + ' productCardImg'}
      >
        <Image
          src={item.image}
          alt={item.name}
          width={80}
          height={80}
          className={`
            object-cover w-full h-full transition-all duration-600 ease-out rounded-xl
            border border-white/15
            group-hover:scale-105
            group-hover:brightness-110
            group-hover:shadow-[0_6px_24px_rgba(255,255,255,0.18)]
          `}
          style={{
            transition: "transform .62s cubic-bezier(.42,0,.28,1), box-shadow .59s cubic-bezier(.42,0,.28,1)"
          }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <span className="block font-extrabold text-[1.11rem] truncate bg-gradient-to-r from-white via-white/97 to-zinc-200/93 bg-clip-text text-transparent tracking-tight">
          {item.name}
        </span>
        <span className="block text-white/40 text-xs uppercase tracking-widest leading-tight mt-1 font-semibold">
          {item.color} / {item.size}
        </span>
        <div className="flex items-center gap-3 mt-2">
          {item.price !== item.finalPrice && (
            <span className="text-white/40 line-through text-[.97rem] font-light tracking-wide opacity-50">
              ₹{item.price.toLocaleString()}
            </span>
          )}
          <span className="font-black text-lg bg-gradient-to-r from-white via-white to-slate-200 bg-clip-text text-transparent tracking-widest drop-shadow-[0_1.8px_7.5px_rgba(255,255,255,0.20)]">
            ₹{item.finalPrice?.toLocaleString() ?? item.price.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="text-white/85 ml-6 font-semibold text-[15.5px]">×{item.quantity}</div>
    </div>
  );
}

// --- Coupon Input ---
const couponInputFormClass = `
  flex items-center gap-2 mt-4 relative group
`;

function CouponInput({
  couponCode,
  setCouponCode,
  applyCoupon,
  appliedCoupon,
  showCouponSuccess
}) {
  return (
    <form
      onSubmit={applyCoupon}
      autoComplete="off"
      className={couponInputFormClass}
    >
      <input
        type="text"
        name="coupon"
        value={couponCode}
        disabled={appliedCoupon}
        onChange={e => setCouponCode(e.target.value)}
        className={`
          flex-1 rounded-2xl px-4 py-2 bg-black/85 border border-white/15 text-white
          font-semibold placeholder:text-white/35 outline-none ring-0
          transition-all duration-600 ease-out
          focus:ring-2 focus:ring-white/20 focus:border-white/40 focus:bg-black/80
          hover:border-white/25
          ${appliedCoupon ? "opacity-60 cursor-not-allowed" : ""}
        `}
        placeholder="Gift card or discount code"
        autoComplete="off"
        style={{
          fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
        }}
      />
      <button
        type="submit"
        disabled={appliedCoupon}
        className={`
          relative px-5 py-2 sm:py-2.5 rounded-full font-black text-black bg-gradient-to-r from-white to-zinc-200
          shadow-[0_10px_32px_rgba(255,255,255,0.12)]
          overflow-hidden group transition-all duration-600 ease-out
          focus:ring-2 focus:ring-white/30 focus:scale-98
          disabled:opacity-40 disabled:cursor-not-allowed
        `}
      >
        <span className="relative z-10 transition-all duration-600 ease-out group-hover:text-white">
          Apply
        </span>
        <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-600 ease-out">
          <span className="absolute bottom-0 left-0 w-full h-full bg-black/85 transition-all duration-600 ease-out" style={{transform: 'translateY(100%)'}}></span>
        </span>
      </button>
      {showCouponSuccess && (
        <span className="ml-3 text-[1rem] font-bold text-green-300 animate-premiumPulse select-none">
          Coupon applied!
        </span>
      )}
    </form>
  );
}

// ---- Main Checkout Page ----

const pageCenterClass = `
  min-h-screen flex flex-col items-center justify-center bg-black animate-luxFadeIn
`;

const mainPageClass = `
  min-h-screen text-white flex flex-col items-center py-10 px-2 sm:px-6
  animate-luxFadeIn bg-black
`;

const mainLayoutClass = `
  w-full max-w-6xl flex flex-col md:flex-row gap-14 md:gap-12 transition-all duration-600 ease-out
`;

const leftFormSectionClass = `
  flex-1 min-w-0 md:w-[65%]
  bg-gradient-to-b from-white/10 to-white/0 rounded-3xl
  border border-white/20
  shadow-[0_20px_80px_rgba(255,255,255,0.18)]
  px-6 sm:px-12 py-10 md:py-14 mb-10 md:mb-0
  transition-all duration-600 ease-out
  hover:-translate-y-1.5 hover:shadow-[0_32px_120px_rgba(255,255,255,0.22)] hover:border-white/40
  will-change-transform
`;

const h1Class = `
  text-[2.23rem] sm:text-[2.55rem]
  font-extrabold
  mb-7
  tracking-tighter uppercase
  bg-gradient-to-br from-white via-white/96 to-zinc-200/80 bg-clip-text text-transparent
  drop-shadow-[0_4px_26px_rgba(255,255,255,0.11)]
`;

const shippingInfoClass = `
  bg-gradient-to-b from-white/10 to-white/0
  border border-white/12
  px-6 py-7 sm:py-8 rounded-2xl flex flex-col items-center mb-8
  shadow-[0_10px_32px_rgba(255,255,255,0.10)]
  transition-all duration-600 ease-out
`;

const asideCardClass = `
  bg-gradient-to-b from-white/10 to-white/0 rounded-3xl px-6 py-9
  border border-white/15
  shadow-[0_20px_80px_rgba(255,255,255,0.15)]
  transition-all duration-600 ease-out
`;

export default function CheckoutPage() {
  // Hydration protection
  const [mounted, setMounted] = useState(false);

  // Cart hook - must be at the top level before useEffect
  const { cartItems, clearCart } = useCart();

  // Steps and form
  const [step, setStep] = useState(1); // 1 = Info, 2 = Shipping, 3 = Payment

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    // company: "", // REMOVED
    address: "",
    apt: "",
    country: "India",
    city: "",
    state: "",
    pin: "",
    phone: "",
    createAccount: false,
  });
  const [formErrors, setFormErrors] = useState({});

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(false);
  const [showCouponSuccess, setShowCouponSuccess] = useState(false);

  // Payment method selection ("online" | "cod")
  const [paymentMethod, setPaymentMethod] = useState("online");

  // Payment state
  const paymentButtonRef = useRef(null);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  // Mount effects for safe hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Order total logic (SSR safe)
  const itemsWithFinalPrice = mounted
    ? cartItems.map(item => ({
        ...item,
        finalPrice: item.finalPrice ?? item.price
      }))
    : [];

  const subtotal = mounted
    ? itemsWithFinalPrice.reduce(
        (sum, item) =>
          sum + (item.finalPrice ?? item.price) * item.quantity,
        0
      )
    : 0;

  const shipping = mounted
    ? subtotal > 15000
      ? 0
      : subtotal === 0
      ? 0
      : 0
    : 0;

  const discount = appliedCoupon && mounted ? Math.floor(subtotal * 0.15) : 0;
  const total = mounted ? subtotal + shipping - discount : 0;

  // --- Coupon logic ---
  function handleApplyCoupon(e) {
    e.preventDefault();
    if (appliedCoupon) return;
    if (couponCode.trim().toLowerCase() === "soul15") {
      setAppliedCoupon(true);
      setShowCouponSuccess(true);
      setTimeout(() => setShowCouponSuccess(false), 1700);
    } else {
      setShowCouponSuccess(false);
      window?.alert?.("Invalid coupon code.");
    }
  }

  async function saveOrderDraft() {
    const orderData = {
      customer: {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      },
      shippingAddress: {
        address: form.address,
        apt: form.apt,
        city: form.city,
        state: form.state,
        pin: form.pin,
        country: form.country,
      },
      items: cartItems,
      subtotal,
      discount,
      shipping,
      total,
      payment: {
        method: "razorpay",
        status: "pending",
      },
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    const data = await res.json();
    return data.orderId;
  }

  // --- Step Transitions ---
  async function handleContinue(e) {
    e.preventDefault();
    if (!validateInfo()) return;

    const orderId = await saveOrderDraft();
    localStorage.setItem("orderId", orderId); // payment kosam
    setStep(2);
  }

  // --- Validation ---
  function validateInfo() {
    const errors = {};
    if (
      !form.email ||
      !/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(form.email)
    )
      errors.email = true;
    if (!form.firstName) errors.firstName = true;
    if (!form.lastName) errors.lastName = true;
    if (!form.address) errors.address = true;
    if (!form.city) errors.city = true;
    if (!form.state) errors.state = true;
    if (!form.pin || !/^\d{6}$/.test(form.pin)) errors.pin = true;
    if (!form.phone || !/^[6-9]\d{9}$/.test(form.phone)) errors.phone = true;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // --- COD Handler ---
  async function handleCOD() {
    try {
      const orderId = localStorage.getItem("orderId");
      if (!orderId) {
        window?.alert?.("Invalid order.");
        return;
      }
      await fetch("/api/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentMethod: "cod",
          paymentStatus: "pending",
          orderStatus: "confirmed"
        }),
      });
      window.alert("Order placed with Cash on Delivery.");
      clearCart();
      localStorage.removeItem("orderId");
      setStep(1);
    } catch (err) {
      window?.alert?.("Could not place order. Please try again.");
    }
  }

  // --- Payment Handler w/ Razorpay initialization ---
  async function handlePayment() {
    if (!mounted || itemsWithFinalPrice.length === 0 || razorpayLoading) {
      window?.alert?.("Your cart is empty.");
      return;
    }
    setRazorpayLoading(true);
    if (paymentButtonRef.current) paymentButtonRef.current.disabled = true;

    try {
      const res = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });
      const data = await res.json();
      if (typeof window === "undefined") return;
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "SOULSEAM",
        description: "Order Payment",
        order_id: data.orderId,
        handler: async function (response) {
          // Update order as paid via online payment
          await fetch("/api/orders/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: localStorage.getItem("orderId"),
              paymentMethod: "online",
              paymentStatus: "paid",
              razorpayPaymentId: response.razorpay_payment_id,
            }),
          });
          window.alert("Payment Successful");
          clearCart();
          localStorage.removeItem("orderId");
          setStep(1);
        },
        prefill: {
          name: form.firstName + " " + form.lastName,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#000000" },
      };
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          new window.Razorpay(options).open();
        };
        document.body.appendChild(script);
      } else {
        new window.Razorpay(options).open();
      }
    } finally {
      setTimeout(() => {
        if (paymentButtonRef.current) paymentButtonRef.current.disabled = false;
        setRazorpayLoading(false);
      }, 1800);
    }
  }

  function fieldClass(errorKey) {
    // Premium field: dark bg, soft subtle border, strong rounded
    return `
      w-full rounded-2xl px-4 py-2 sm:py-2.5
      bg-black/85 border border-white/15
      text-white/93 font-semibold
      placeholder:text-white/30 placeholder:font-medium
      transition-all duration-600 ease-out
      focus:bg-black/75 focus:border-white/40 focus:ring-2 focus:ring-white/20
      hover:border-white/30
      outline-none ring-0
      sm:text-[1.07rem]
      ${formErrors[errorKey]
        ? "border-white/50"
        : ""
      }
    `;
  }

  // ---- Render: Hydration safety ----
  if (!mounted) {
    return (
      <>
        <div className={pageCenterClass + " animate-reveal"}>
          <span className={`
            text-4xl mb-6 font-extrabold tracking-widest uppercase bg-gradient-to-br from-white via-zinc-300/92 to-zinc-400/91 bg-clip-text text-transparent
          `}
            style={{ fontFamily: "Poppins,Inter,sans-serif", letterSpacing: "0.17em" }}
          >
            SOULSEAM
          </span>
          <div className={`
            w-44 h-3.5 rounded-xl overflow-hidden relative
            bg-gradient-to-b from-white/10 to-white/0
            shadow-[0_14px_40px_0_rgba(255,255,255,0.13)]
          `}>
            <div className={`
              absolute left-0 top-0 h-full w-2/3
              bg-gradient-to-r from-white/25 via-white/0 to-white/13 animate-loaderShine opacity-90
            `}></div>
          </div>
        </div>
        {/* Moved loaderShine, animate-luxFadeIn, and related keyframes to below */}
        <RootCheckoutPageGlobalStyles />
      </>
    );
  }

  // ---- Main Page ----
  return (
    <>
      <div
        className={mainPageClass + " animate-reveal"}
        style={{
          background: "#000",
          letterSpacing: '0.01em',
        }}
      >
        <div className={mainLayoutClass}>
          {/* --- LEFT FORM --- */}
          <section className={leftFormSectionClass + " animate-reveal"}>
            <h1
              className={h1Class}
              style={{
                fontFamily: "Poppins,Inter,sans-serif",
                letterSpacing: '0.13em',
                textShadow: "0 1.5px 24px rgba(255,255,255,0.15)"
              }}
            >
              Checkout
            </h1>
            <ProgressBar step={step} />
            {/* Steps */}
            <form
              className={`premium-fade-in premium-slide-in w-full max-w-lg transition-all duration-600 ease-out`}
              autoComplete="off"
              onSubmit={handleContinue}
              style={{ minHeight: 420 }}
            >
              {/* --- STEP 1 --- */}
              {step === 1 && (
                <div className={`premium-step-animate animate-reveal`}>
                  <h2 className={`mb-5 text-xl font-bold uppercase tracking-wide text-white/93`}>
                    Information
                  </h2>
                  <div className="mb-6">
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="Email address*"
                      className={fieldClass("email")}
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                    {formErrors.email && <span className="text-xs text-rose-400/91 pl-2 border-b-2 border-rose-400/72 font-semibold">Valid email required</span>}
                  </div>
                  <h2 className="mb-3 text-lg font-semibold tracking-wide text-white/90">
                    Shipping Address
                  </h2>
                  <div className={`flex flex-col gap-5 sm:gap-4`}>
                    <div className={`flex flex-row gap-3`}>
                      <input
                        type="text" placeholder="First Name*" className={fieldClass("firstName")}
                        value={form.firstName}
                        onChange={e => setForm({ ...form, firstName: e.target.value })}
                      />
                      <input
                        type="text" placeholder="Last Name*" className={fieldClass("lastName")}
                        value={form.lastName}
                        onChange={e => setForm({ ...form, lastName: e.target.value })}
                      />
                    </div>
                    {/* Company name (optional) input removed */}
                    <input
                      type="text" placeholder="Street address*" className={fieldClass("address")}
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                    />
                    <input
                      type="text" placeholder="Apartment / Suite (optional)" className={fieldClass("apt")}
                      value={form.apt}
                      onChange={e => setForm({ ...form, apt: e.target.value })}
                    />
                    <div className={`flex flex-row gap-3`}>
                      <select
                        className={fieldClass("country")}
                        value={form.country}
                        onChange={e => setForm({ ...form, country: e.target.value })}
                      >
                        <option value="India">India</option>
                      </select>
                      <input
                        type="text" placeholder="City*" className={fieldClass("city")}
                        value={form.city}
                        onChange={e => setForm({ ...form, city: e.target.value })}
                      />
                    </div>
                    <div className={`flex flex-row gap-3`}>
                      <select
                        className={fieldClass("state")}
                        value={form.state}
                        onChange={e => setForm({ ...form, state: e.target.value })}
                      >
                        <option value="">Select State*</option>
                        {INDIAN_STATES.map(state => (
                          <option value={state} key={state}>{state}</option>
                        ))}
                      </select>
                      <input
                        type="text" placeholder="PIN code*" className={fieldClass("pin")}
                        value={form.pin}
                        onChange={e => setForm({ ...form, pin: e.target.value })}
                      />
                    </div>
                    <input
                      type="text" placeholder="Phone number*" className={fieldClass("phone")}
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                    {formErrors.phone && <span className="text-xs text-rose-400/91 pl-2 border-b-2 border-rose-400/71 font-semibold">Valid 10-digit Indian number</span>}
                    <div className={`flex items-center mt-3`}>
                      <input
                        id="create-account"
                        type="checkbox"
                        checked={form.createAccount}
                        onChange={e => setForm({ ...form, createAccount: e.target.checked })}
                        className={`w-4 h-4 accent-white bg-black border border-white/15 rounded-full mr-2 focus:ring-2 focus:accent-gray-200`}
                        style={{ boxShadow: "0 0 0 1.1px #e9edff18" }}
                      />
                      <label htmlFor="create-account" className="text-sm select-none text-white/90 font-semibold">Create an account?</label>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className={`
                      mt-10 mb-4 sm:mb-3 relative py-3.5 px-8 rounded-full font-extrabold text-black bg-gradient-to-r from-white to-zinc-200
                      shadow-[0_10px_32px_rgba(255,255,255,0.13)]
                      overflow-hidden group transition-all duration-600 ease-out
                      tracking-widest text-[1.15rem] select-none
                      disabled:opacity-38 disabled:cursor-not-allowed
                      ${itemsWithFinalPrice.length === 0 ? "opacity-38 cursor-not-allowed pointer-events-none" : ""}
                    `}
                    style={{
                      fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                    }}
                    disabled={itemsWithFinalPrice.length === 0}
                  >
                    <span className="relative z-10 flex items-center transition-all duration-600 ease-out group-hover:text-white">
                      Continue to Shipping
                      <span className="ml-2 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-600 ease-out">
                        <svg width="18" height="18" fill="none" className="inline" viewBox="0 0 24 24">
                          <path d="M12 5l7 7-7 7M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </span>
                    <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-600 ease-out">
                      <span className="absolute bottom-0 left-0 w-full h-full bg-black/90 transition-all duration-600 ease-out" style={{transform: 'translateY(100%)'}}></span>
                    </span>
                  </button>
                </div>
              )}
              {/* --- STEP 2 (Shipping) --- */}
              {step === 2 && (
                <div className={`premium-step-animate animate-reveal`}>
                  <h2 className={`mb-5 text-xl font-bold uppercase tracking-wide text-white/93`}>
                    Shipping
                  </h2>
                  <div className={shippingInfoClass}>
                    <div className="mb-2 font-normal text-white/90">
                      <span className="text-lg font-black mr-2">Shipping Method:</span>
                      <span className="ml-2">Express Delivery: <span className="text-white">{shipping === 0 ? "Free" : `₹${shipping}`}</span></span>
                    </div>
                    <div className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">
                      Est. Delivery: 2–7 Days Pan India
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`
                      relative py-3.5 px-8 rounded-full font-black text-black bg-gradient-to-r from-white to-zinc-200
                      shadow-[0_10px_32px_rgba(255,255,255,0.13)]
                      overflow-hidden group transition-all duration-600 ease-out
                      tracking-widest text-[1.15rem] select-none
                      disabled:opacity-34 disabled:cursor-not-allowed
                      ${itemsWithFinalPrice.length === 0 ? "opacity-34 cursor-not-allowed pointer-events-none" : ""}
                    `}
                    onClick={() => itemsWithFinalPrice.length > 0 && setStep(3)}
                    style={{
                      fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                    }}
                    disabled={itemsWithFinalPrice.length === 0}
                  >
                    <span className="relative z-10 flex items-center transition-all duration-600 ease-out group-hover:text-white">
                      Continue to Payment
                      <span className="ml-2 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-600 ease-out">
                        <svg width="18" height="18" fill="none" className="inline" viewBox="0 0 24 24">
                          <path d="M12 5l7 7-7 7M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </span>
                    <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-600 ease-out">
                      <span className="absolute bottom-0 left-0 w-full h-full bg-black/90 transition-all duration-600 ease-out" style={{transform: 'translateY(100%)'}}></span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`block mt-6 text-white/50 underline underline-offset-4 text-sm font-bold hover:text-white/91 transition select-none focus:underline`}
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                </div>
              )}
              {/* --- STEP 3 (Payment) --- */}
              {step === 3 && (
                <div className={`premium-step-animate animate-reveal`}>
                  <h2 className={`mb-7 text-xl font-bold uppercase tracking-wide text-white/93`}>
                    Payment
                  </h2>
                  {/* Payment Method Selection */}
                  <div className="mb-7">
                    <div className="flex items-center gap-7 sm:gap-4">
                      <label className="flex items-center cursor-pointer select-none">
                        <input
                          type="radio"
                          className="w-5 h-5 accent-black border border-white/15 mr-2"
                          name="paymentMethod"
                          value="online"
                          checked={paymentMethod === "online"}
                          onChange={() => setPaymentMethod("online")}
                        />
                        <span className="font-semibold text-white/90">
                          Online Payment <span className="text-xs font-bold uppercase text-white/38 ml-2">Razorpay, UPI, Cards</span>
                        </span>
                      </label>
                      <label className="flex items-center cursor-pointer select-none">
                        <input
                          type="radio"
                          className="w-5 h-5 accent-black border border-white/15 mr-2"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === "cod"}
                          onChange={() => setPaymentMethod("cod")}
                        />
                        <span className="font-semibold text-white/90">
                          Cash on Delivery <span className="text-xs font-bold uppercase text-white/38 ml-2">(COD)</span>
                        </span>
                      </label>
                    </div>
                  </div>
                  {/* Conditional payment action buttons */}
                  <div className={`flex flex-col gap-7 sm:gap-6`}>
                    {paymentMethod === "online" && (
                      <button
                        ref={paymentButtonRef}
                        type="button"
                        className={`
                          relative py-4 px-8 mt-2 rounded-full font-extrabold text-black bg-gradient-to-r from-white to-zinc-200
                          shadow-[0_10px_32px_rgba(255,255,255,0.13)]
                          overflow-hidden group transition-all duration-600 ease-out
                          tracking-wider text-[1.35rem] select-none
                          disabled:opacity-36 disabled:cursor-not-allowed
                          ${razorpayLoading || itemsWithFinalPrice.length === 0 ? "opacity-36 pointer-events-none cursor-not-allowed" : ""}
                        `}
                        style={{
                          fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                        }}
                        onClick={handlePayment}
                        disabled={razorpayLoading || itemsWithFinalPrice.length === 0}
                      >
                        <span className="relative z-10 flex items-center transition-all duration-600 ease-out group-hover:text-white">
                          Pay&nbsp;
                          <span className="font-extrabold underline underline-offset-4 bg-gradient-to-r from-white/97 via-white to-zinc-300 bg-clip-text text-transparent text-[1.33em] drop-shadow-[0_0_11px_rgba(255,255,255,0.20)] select-none">
                            ₹{total.toLocaleString()}
                          </span>
                          <span className="ml-2 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-600 ease-out">
                            <svg width="18" height="18" fill="none" className="inline" viewBox="0 0 24 24">
                              <path d="M12 5l7 7-7 7M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                          {razorpayLoading &&
                            <span className="ml-3 text-xs font-normal text-white/60 animate-premiumPulse align-super select-none font-semibold">(processing…)</span>
                          }
                        </span>
                        <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-600 ease-out">
                          <span className="absolute bottom-0 left-0 w-full h-full bg-black/90 transition-all duration-600 ease-out" style={{transform: 'translateY(100%)'}}></span>
                        </span>
                      </button>
                    )}
                    {paymentMethod === "cod" && (
                      <button
                        type="button"
                        className={`
                          relative py-4 px-8 mt-2 rounded-full font-extrabold text-black bg-gradient-to-r from-white to-zinc-200
                          shadow-[0_12px_32px_rgba(255,255,255,0.13)]
                          overflow-hidden group transition-all duration-600 ease-out
                          tracking-wider text-[1.17rem] select-none
                          disabled:opacity-36 disabled:cursor-not-allowed
                          ${itemsWithFinalPrice.length === 0 ? "opacity-36 pointer-events-none cursor-not-allowed" : ""}
                        `}
                        style={{
                          fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                        }}
                        onClick={handleCOD}
                        disabled={itemsWithFinalPrice.length === 0}
                      >
                        <span className="relative z-10 flex items-center transition-all duration-600 ease-out group-hover:text-white">
                          Place Order&nbsp;(Cash on Delivery)
                          <span className="ml-2 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-600 ease-out">
                            <svg width="18" height="18" fill="none" className="inline" viewBox="0 0 24 24">
                              <path d="M12 5l7 7-7 7M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        </span>
                        <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-600 ease-out">
                          <span className="absolute bottom-0 left-0 w-full h-full bg-black/90 transition-all duration-600 ease-out" style={{transform: 'translateY(100%)'}}></span>
                        </span>
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`block mt-7 text-white/50 underline underline-offset-4 text-sm font-semibold hover:text-white/90 transition select-none focus:underline`}
                    onClick={() => setStep(2)}
                  >
                    Back
                  </button>
                </div>
              )}
            </form>
          </section>
          {/* --- RIGHT ORDER SUMMARY --- */}
          <aside className={`w-full md:w-[35%] max-w-lg sticky top-10 self-start`}>
            <div className={asideCardClass + " animate-reveal"}>
              <h2 className={`
                text-xl font-black mb-8 uppercase tracking-[0.19em] bg-gradient-to-r from-white via-white/90 to-zinc-200/70 bg-clip-text text-transparent
                leading-tight drop-shadow-[0_3px_19px_rgba(255,255,255,0.12)]
              `}
                style={{
                  fontFamily: "Inter,Poppins,Neue Haas,sans-serif"
                }}>
                Your Order
              </h2>
              <div className="mb-8">
                {itemsWithFinalPrice.length === 0 ? (
                  <div className="text-white/45 text-sm py-8 text-center min-h-[98px] flex items-center justify-center rounded-xl border border-white/12 bg-gradient-to-r from-black/70 via-black/60 to-black/90 font-semibold">
                    Your cart is empty.
                  </div>
                ) : (
                  itemsWithFinalPrice.map(item => (
                    <CheckoutProductCard
                      key={item.id + item.size + item.color}
                      item={item}
                    />
                  ))
                )}
              </div>
              <CouponInput
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                applyCoupon={handleApplyCoupon}
                appliedCoupon={appliedCoupon}
                showCouponSuccess={showCouponSuccess}
              />
              {/* --- Summary --- */}
              <div className={`
                my-8 border-t border-white/12 pt-6 space-y-4 text-[1.07rem] font-semibold leading-tight
              `}>
                <div className="flex justify-between items-center">
                  <span className="text-white/85 font-bold">Subtotal</span>
                  <span className="tracking-wider">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 font-semibold">Shipping</span>
                  <span>
                    {shipping === 0
                      ? <span className="text-green-200/95 font-bold">Free</span>
                      : `₹${shipping}`}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-green-300/90 font-bold">
                    <span className="font-semibold tracking-wide">Coupon Discount</span>
                    <span className="text-green-200/92 font-bold">-₹{discount.toLocaleString()}</span>
                  </div>
                )}
             <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/15">
            {/* TOTAL LABEL */}
            <span
              className="
                text-white/90 tracking-widest font-extrabold
                text-sm sm:text-base
                leading-none select-none
              "
            >
              Total
            </span>

            {/* TOTAL AMOUNT */}
            <span
              className="
                tracking-widest font-extrabold
                text-lg sm:text-xl
                bg-gradient-to-r from-white via-zinc-100 to-white/80
                bg-clip-text text-transparent
                leading-none
                transition-transform duration-300
                hover:scale-[1.03]
              "
            >
              ₹{total.toLocaleString()}
            </span>
          </div>
           </div>
            </div>
          </aside>
        </div>
      </div>
      <RootCheckoutPageGlobalStyles />
    </>
  );
}


// ---- GLOBAL STYLES FOR PREMIUM EFFECTS ----

function RootCheckoutPageGlobalStyles() {
  return (
    <style jsx global>{`
      /* Group hover effect for CheckoutProductCard .group:after */
      .group:after {
        content: "";
        border-radius: 16px;
        pointer-events: none;
        position: absolute;
        z-index: 2;
        left: 0; top: 0; width: 100%; height: 100%;
        box-shadow: 0 0 0 2.5px rgba(255,255,255,0.10);
        opacity: 0;
        transition: opacity .62s cubic-bezier(.4,0,.2,1);
      }
      .group:hover:after {
        opacity: 1;
      }

      /* Premium group-hover interactions for form/action buttons in all steps */
      .group:hover span.absolute>span {
        transform: translateY(0%);
        transition: transform 0.6s cubic-bezier(.4,0,.2,1);
      }
      .group:hover .relative.z-10,
      .group:hover span.relative {
        color: #fff !important;
      }
      .group:hover svg {
        color: #fff !important;
      }

      /* CouponInput animation for feedback */
      @keyframes premiumPulse {
        0% { opacity: 0.8; transform: scale(1);}
        38% { opacity: 1; transform: scale(1.13);}
        95% { opacity: 1; transform: scale(1);}
        100% { opacity: 0; transform: scale(1);}
      }
      .animate-premiumPulse { animation: premiumPulse 1.68s cubic-bezier(.4,0,.2,1); }

      /* Loader shimmer for mount splash */
      @keyframes loaderShine {
        0% { left: -72%; opacity: 0.12; }
        54% { left: 63%; opacity: 0.39;}
        100% { left: 146%; opacity: 0;}
      }
      .animate-luxFadeIn {
        animation: luxFadeIn 0.78s cubic-bezier(.4,0,.2,1);
      }
      .animate-reveal {
        animation: revealSection .95s cubic-bezier(.42,0,.2,1);
      }
      @keyframes luxFadeIn {
        from { opacity: 0; transform: scale(0.97) translateY(20px);}
        to { opacity: 1; transform: none;}
      }
      @keyframes revealSection {
        from { opacity: 0; transform: scale(0.98) translateY(34px);}
        to { opacity: 1; transform: none;}
      }

      /* Main Page & Step transitions */
      .premium-fade-in {
        animation: fadeInLuxury 0.88s cubic-bezier(.4,0,.2,1);
      }
      .premium-slide-in { animation: slideInLuxury 1.03s cubic-bezier(.4,0,.2,1);}
      @keyframes fadeInLuxury {
        from { opacity: 0; transform: scale(0.98) translateY(44px);}
        to { opacity: 1; transform: none;}
      }
      @keyframes slideInLuxury {
        from { transform: scale(0.986) translateY(34px); opacity: 0;}
        to { transform: none; opacity: 1;}
      }
      .premium-step-animate {
        animation: premiumStepUp .71s cubic-bezier(.4,0,.2,1);
      }
      @keyframes premiumStepUp {
        from { opacity: 0; transform: scale(0.991) translateY(32px);}
        to { opacity: 1; transform: none;}
      }
      /* Additional reveal for page load and fade */
      .animate-reveal {
        animation: revealSection .99s cubic-bezier(.41,0,.22,1);
      }
      @keyframes revealSection {
        from { opacity: 0; transform: scale(0.98) translateY(38px);}
        to { opacity: 1; transform: none;}
      }
      /* PremiumShine shimmer for cards and line divider */
      @keyframes premiumShine {
        0% { left: -72%; opacity: 0.055;}
        54% { left: 82%; opacity: 0.21;}
        100% { left: 130%; opacity: 0;}
      }
      .animate-premiumShine { animation: premiumShine 1.63s cubic-bezier(.4,0,.2,1); }
      /* PremiumPulse duplicate for redundancy and build safety */
      .animate-premiumPulse {
        animation: premiumPulse 1.48s cubic-bezier(.4,0,.2,1);
      }
      @keyframes premiumPulse {
        0% { opacity: 0.7; transform: scale(1);}
        28% { opacity: 1; transform: scale(1.11);}
        89% { opacity: 1; transform: scale(1);}
        100% { opacity: 0.7; transform: scale(1);}
      }
      /* Slow down animations by 20% and increase shadow depth slightly. */
      input:-webkit-autofill,
      input:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0px 1000px #000 inset !important;
        -webkit-text-fill-color: #fff !important;
      }
    `}</style>
  );
}