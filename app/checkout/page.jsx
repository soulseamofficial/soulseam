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
const ProgressBar = ({ step, setStep }) => {
  const router = useRouter();
  const progress = ["Cart", "Information", "Shipping", "Payment"];
  // Determine eligibility for Shipping and Payment step navigation
  const orderDraftExists = typeof window !== "undefined" && !!localStorage.getItem("orderId");
  const canGoToShipping = orderDraftExists;
  const canGoToPayment = step > 2 || (typeof window !== "undefined" && !!localStorage.getItem("orderId") && step >= 2);

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
                if (label === "Information" && step !== 1) {
                  setStep(1);
                }
                if (
                  label === "Shipping" &&
                  step !== 2 &&
                  canGoToShipping
                ) {
                  setStep(2);
                }
                if (
                  label === "Payment" &&
                  step !== 3 &&
                  canGoToPayment
                ) {
                  setStep(3);
                }
              }}
              className={`
                uppercase tracking-widest font-black transition-all duration-600 ease-out
                ${idx <= step
                  ? "text-white"
                  : "text-white/25"}
                ${
                  label === "Cart"
                    ? "cursor-pointer hover:underline"
                    : (
                      (label === "Information" && step !== 1) ||
                      (label === "Shipping" && canGoToShipping && step !== 2) ||
                      (label === "Payment" && canGoToPayment && step !== 3)
                    )
                      ? "cursor-pointer hover:underline"
                      : "cursor-default"
                }
              `}
              disabled={
                (label === "Shipping" && !canGoToShipping) ||
                (label === "Payment" && !canGoToPayment)
              }
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
const checkoutProductCardClass = `flex items-center mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white/10 to-white/0 group
  border border-white/15
  shadow-[0_20px_80px_rgba(255,255,255,0.13)]
  relative transition-all duration-600 ease-out
  hover:-translate-y-2.5 hover:shadow-[0_32px_100px_rgba(255,255,255,0.19)]
  hover:border-white/25
  will-change-transform
`;

const checkoutProductCardImgClass = `w-16 h-16 sm:w-20 sm:h-20 mr-4 shrink-0 relative overflow-hidden rounded-xl
  bg-gradient-to-b from-black/70 via-black/65 to-black/80
  transition-all duration-600 ease-out
`;

function CheckoutProductCard({ item }) {
  return (
    <div
      className={checkoutProductCardClass}
    >
      <div
        className={`${checkoutProductCardImgClass} productCardImg`}
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
const couponInputFormClass = `flex items-center gap-2 mt-4 relative group`;

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

const pageCenterClass = `min-h-screen flex flex-col items-center justify-center bg-black animate-luxFadeIn`;

const mainPageClass = `min-h-screen text-white flex flex-col items-center py-10 px-2 sm:px-6
  animate-luxFadeIn bg-black
`;

const mainLayoutClass = `w-full max-w-6xl flex flex-col md:flex-row gap-14 md:gap-12 transition-all duration-600 ease-out`;

const leftFormSectionClass = `flex-1 min-w-0 md:w-[65%]
  bg-gradient-to-b from-white/10 to-white/0 rounded-3xl
  border border-white/20
  shadow-[0_20px_80px_rgba(255,255,255,0.18)]
  px-6 sm:px-12 py-10 md:py-14 mb-10 md:mb-0
  transition-all duration-600 ease-out
  hover:-translate-y-1.5 hover:shadow-[0_32px_120px_rgba(255,255,255,0.22)] hover:border-white/40
  will-change-transform
`;

const h1Class = `text-[2.23rem] sm:text-[2.55rem]
  font-extrabold
  mb-7
  tracking-tighter uppercase
  bg-gradient-to-br from-white via-white/96 to-zinc-200/80 bg-clip-text text-transparent
  drop-shadow-[0_4px_26px_rgba(255,255,255,0.11)]
`;

const shippingInfoClass = `bg-gradient-to-b from-white/10 to-white/0
  border border-white/12
  px-6 py-7 sm:py-8 rounded-2xl flex flex-col items-center mb-8
  shadow-[0_10px_32px_rgba(255,255,255,0.10)]
  transition-all duration-600 ease-out
`;

const asideCardClass = `bg-gradient-to-b from-white/10 to-white/0 rounded-3xl px-6 py-9
  border border-white/15
  shadow-[0_20px_80px_rgba(255,255,255,0.15)]
  transition-all duration-600 ease-out
`;

// --- Address Summary (Shipping Step) ---
function AddressSummary({ form }) {
  // Compose address lines
  const name = [form.firstName, form.lastName].filter(Boolean).join(" ");
  const streetLine = [form.address, form.apt].filter(Boolean).join(", ");
  const cityStatePin = [form.city, form.state, form.pin].filter(Boolean).join(", ");
  const phone = form.phone;

  // Hide if not filled in (should be, if step 2 reached)
  if (!name && !streetLine && !cityStatePin && !phone) return null;

  return (
    <div
      className={`
        w-full bg-gradient-to-b from-white/10 to-white/0
        border border-white/14 rounded-2xl px-6 py-5 mb-8
        flex flex-col items-start
        shadow-[0_6px_24px_rgba(255,255,255,0.09)]
        transition-all duration-600 ease-out
        animate-premiumFadeIn
      `}
      style={{ fontFamily: "Inter,Poppins,Neue Haas,sans-serif" }}
    >
      <div className="font-bold mb-2 text-[1.04rem] uppercase tracking-wider text-white/93">
        Shipping Address
      </div>
      <div className="text-white/94 text-base font-semibold leading-tight mb-1">
        <span className="">{name}</span>
      </div>
      <div className="text-white/80 text-xs sm:text-sm font-medium mb-1">
        {streetLine}
      </div>
      <div className="text-white/80 text-xs sm:text-sm font-medium mb-1">
        {cityStatePin}
      </div>
      <div className="text-white/70 text-xs font-bold tracking-widest mt-1 select-none">
        +91 {phone}
      </div>
    </div>
  );
}

// ---- Payment Method Card UI ----
function PaymentMethodCard({ icon, label, desc, active, onClick }) {
  return (
    <div
      className={`
        flex flex-col sm:flex-row items-center sm:items-center gap-2
        px-5 sm:px-6 py-6 sm:py-4 rounded-2xl transition-all duration-500 ease-out
        cursor-pointer bg-black/60
        border-2 ${active ? "border-white/85 shadow-[0_2px_32px_rgba(255,255,255,0.22)] scale-[1.025]" : "border-white/17"}
        hover:border-white/60 hover:scale-[1.018]
        will-change-transform select-none
      `}
      onClick={onClick}
      tabIndex={0}
      style={{
        fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
        outline: active ? "2px solid #fff" : undefined,
      }}
      aria-pressed={active}
      role="button"
    >
      <div className="flex items-center">
        {icon}
      </div>
      <div className="ml-2 flex-1 flex flex-col sm:flex-row sm:items-center gap-1">
        <span className={`font-bold text-[1.13rem] tracking-wide text-white${active ? "" : "/93"}`}>{label}</span>
        {desc &&
          <span className="ml-2 text-xs font-bold uppercase text-white/38">{desc}</span>
        }
      </div>
      {active && (
        <span className="ml-auto text-green-300/90 font-extrabold tracking-wider text-sm sm:text-base select-none">&#10003;</span>
      )}
    </div>
  );
}

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
  // track blur for all fields for error showing
  const [touched, setTouched] = useState({});

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(false);
  const [showCouponSuccess, setShowCouponSuccess] = useState(false);

  // Payment method selection ("not_selected" | "online" | "cod")
  const [paymentMethod, setPaymentMethod] = useState("not_selected");

  // Payment state
  const paymentButtonRef = useRef(null);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  // --- SHIP STEP: Delivery Check State ---
  const [deliveryCheck, setDeliveryCheck] = useState(null);
  const [deliveryCheckLoading, setDeliveryCheckLoading] = useState(false);
  const [deliveryCheckError, setDeliveryCheckError] = useState(null);

  // Delivery error state for show on main btns
  const [deliveryCreationError, setDeliveryCreationError] = useState(null);

  // Mount effects for safe hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Run delivery check on entering Shipping step (step === 2)
  useEffect(() => {
    // Only run if in Shipping step and form has PIN, address, etc.
    async function handleDeliveryCheck() {
      if (step !== 2) return;
      // Don't run if PIN/Address not provided
      if (
        !form.pin ||
        !/^\d{6}$/.test(form.pin) ||
        !form.address ||
        !form.city ||
        !form.state ||
        !form.country
      ) {
        setDeliveryCheck(null);
        setDeliveryCheckError(null);
        return;
      }
      setDeliveryCheckLoading(true);
      setDeliveryCheckError(null);
      try {
        const res = await fetch("/api/delivery/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: {
              address: form.address,
              apt: form.apt,
              city: form.city,
              state: form.state,
              pin: form.pin,
              country: form.country,
            },
            cart: cartItems,
          }),
        });
        if (!res.ok) {
          throw new Error("Unable to check delivery. Try again later.");
        }
        const data = await res.json();
        const dc = {
          serviceable: !!data.serviceable,
          eta: typeof data.eta === "number" ? data.eta : null,
          shippingCharge: typeof data.shippingCharge === "number" ? data.shippingCharge : null,
          codAvailable: !!data.codAvailable,
        };
        setDeliveryCheck(dc);

        // Update order draft deliveryCheck field
        const orderId = localStorage.getItem("orderId");
        if (orderId) {
          await fetch("/api/orders/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              deliveryCheck: dc,
              orderStatus: "draft",
              paymentStatus: "not_selected",
              deliveryStatus: "not_created",
            }),
          });
        }
      } catch (err) {
        setDeliveryCheckError(
          err && err.message ? err.message : "Could not check delivery availability."
        );
        setDeliveryCheck(null);
      } finally {
        setDeliveryCheckLoading(false);
      }
    }
    handleDeliveryCheck();
    // Only rerun when relevant step/address change/pin change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form.pin, form.address, form.city, form.state, form.country]);

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
        method: "not_selected",   // always not_selected in draft
        status: "not_selected",
        orderStatus: "draft"
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

  // --- Field validation helpers for Info step ---
  // adapted for blur-on-field, and for submit
  function fieldRequired(key) {
    // Only Apartment/Suite is optional
    return key !== "apt";
  }

  function validateField(field, value) {
    switch (field) {
      case "email":
        if (!value || !/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(value)) {
          return "Valid email required";
        }
        break;
      case "firstName":
        if (!value) return "First name required";
        break;
      case "lastName":
        if (!value) return "Last name required";
        break;
      case "address":
        if (!value) return "Street address required";
        break;
      case "city":
        if (!value) return "City required";
        break;
      case "state":
        if (!value) return "State required";
        break;
      case "pin":
        if (!value) return "PIN code required";
        if (!/^\d{6}$/.test(value)) return "Valid 6-digit PIN required";
        break;
      case "phone":
        if (!value) return "Phone number required";
        if (!/^[6-9]\d{9}$/.test(value)) return "Valid 10-digit Indian number";
        break;
      default:
        return "";
    }
    return "";
  }

  // Blur handling for error feedback after user leaves field
  function handleBlur(field) {
    setTouched(t => ({ ...t, [field]: true }));
    const error = validateField(field, form[field]);
    setFormErrors(errors => ({
      ...errors,
      [field]: error ? true : undefined
    }));
  }

  // --- Step Transitions ---
  async function handleContinue(e) {
    e.preventDefault();

    // Mark all as touched (for error display)
    const withTouched = {};
    Object.keys(form).forEach(key => (withTouched[key] = true));
    setTouched(withTouched);

    // Validate all fields for submit
    const errors = {};
    const errorMsgs = {};
    Object.keys(form).forEach(field => {
      // Only check required
      if (fieldRequired(field)) {
        const errorMsg = validateField(field, form[field]);
        if (errorMsg) {
          errors[field] = true;
          errorMsgs[field] = errorMsg;
        }
      }
    });
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    // If createAccount: create user before order
    if (form.createAccount) {
      try {
        const userRes = await fetch("/api/users/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone
          }),
        });
        if (!userRes.ok) {
          const msg =
            userRes.status === 409 // or as per your implementation
              ? "A user with this email already exists. Try logging in."
              : "Could not create account. Please try another email or contact us.";
          window?.alert?.(msg);
          return;
        }
      } catch (err) {
        window?.alert?.("Could not create account. Please try again.");
        return;
      }
    }

    const orderId = await saveOrderDraft();
    localStorage.setItem("orderId", orderId);
    setStep(2);
  }

  // --- Validation for Info Step ---
  function validateInfo() {
    // For compatibility with real-time/error display logic
    const errors = {};
    if (!form.email || !/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(form.email))
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

  // --- COD Handler (rewritten for delivery partner integration) ---
  async function handleCOD() {
    setDeliveryCreationError(null);

    try {
      const orderId = localStorage.getItem("orderId");
      if (!orderId) {
        window?.alert?.("Invalid order.");
        return;
      }

      // 1. Initiate delivery creation BEFORE confirming the order.
      const deliveryRes = await fetch("/api/delivery/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          shippingAddress: {
            address: form.address,
            apt: form.apt,
            city: form.city,
            state: form.state,
            pin: form.pin,
            country: form.country,
          },
          paymentMethod: "cod",
          orderValue: total,
          items: itemsWithFinalPrice,
        }),
      });
      if (!deliveryRes.ok) {
        const errorData = await deliveryRes.json().catch(() => ({}));
        const msg = errorData?.message || "Failed to connect to delivery partner. Please try again.";
        setDeliveryCreationError(msg);
        window?.alert?.("Could not create delivery. Order not confirmed.\n\n" + msg);
        return;
      }
      const deliveryData = await deliveryRes.json();

      // 2. On success, confirm order and save delivery details in Mongo
      await fetch("/api/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentMethod: "cod",
          paymentStatus: "cod",
          orderStatus: "confirmed",
          // Delivery records:
          deliveryStatus: "created",
          deliveryPartner: deliveryData.deliveryPartner,
          trackingId: deliveryData.trackingId || deliveryData.awb,
          awb: deliveryData.awb, // maintain field for flexibility
          pickupScheduled: deliveryData.pickupScheduled,
        }),
      });

      window.alert("Order placed with Cash on Delivery. Delivery created.");
      clearCart();
      localStorage.removeItem("orderId");
      setStep(1);
      setPaymentMethod("not_selected");
    } catch (err) {
      setDeliveryCreationError(
        err && err.message
          ? err.message
          : "Could not place order. Please try again."
      );
      window?.alert?.("Could not create delivery/order. Please try again.");
    }
  }

  // --- Payment Handler w/ Razorpay initialization + delivery partner connect ---
  async function handlePayment() {
    setDeliveryCreationError(null);

    if (
      !mounted ||
      itemsWithFinalPrice.length === 0 ||
      razorpayLoading ||
      paymentMethod !== "online"
    ) {
      window?.alert?.("Please select a payment method and ensure your cart is not empty.");
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
          const orderId = localStorage.getItem("orderId") || undefined;
          if (!orderId) {
            window?.alert?.("Order not found.");
            setRazorpayLoading(false);
            if (paymentButtonRef.current) paymentButtonRef.current.disabled = false;
            return;
          }

          // 1. Create delivery with delivery partner first!
          const deliveryRes = await fetch("/api/delivery/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              shippingAddress: {
                address: form.address,
                apt: form.apt,
                city: form.city,
                state: form.state,
                pin: form.pin,
                country: form.country,
              },
              paymentMethod: "online",
              orderValue: total,
              items: itemsWithFinalPrice,
            }),
          });
          if (!deliveryRes.ok) {
            const errorData = await deliveryRes.json().catch(() => ({}));
            const msg = errorData?.message || "Failed to connect to delivery partner. Please try again.";
            setDeliveryCreationError(msg);
            window?.alert?.("Could not create delivery. Payment not marked as confirmed.\n\n" + msg);
            setRazorpayLoading(false);
            if (paymentButtonRef.current) paymentButtonRef.current.disabled = false;
            return;
          }
          const deliveryData = await deliveryRes.json();

          // 2. If delivery ok, THEN mark order as paid/confirmed, and attach delivery details in order
          await fetch("/api/orders/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              paymentMethod: "online",
              paymentStatus: "paid",
              orderStatus: "confirmed",
              razorpayPaymentId: response.razorpay_payment_id,
              // Delivery details
              deliveryStatus: "created",
              deliveryPartner: deliveryData.deliveryPartner,
              trackingId: deliveryData.trackingId || deliveryData.awb,
              awb: deliveryData.awb,
              pickupScheduled: deliveryData.pickupScheduled,
            }),
          });

          window.alert("Payment Successful and Delivery Created!");
          clearCart();
          localStorage.removeItem("orderId");
          setStep(1);
          setPaymentMethod("not_selected");
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
        ? "border-rose-400/90"
        : ""
      }
    `;
  }

  // ---- Render: Hydration safety ----
  if (!mounted) {
    return (
      <>
        <div className={`${pageCenterClass} animate-reveal`}>
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
        className={`${mainPageClass} animate-reveal`}
        style={{
          background: "#000",
          letterSpacing: '0.01em',
        }}
      >
        <div className={mainLayoutClass}>
          {/* --- LEFT FORM --- */}
          <section className={`${leftFormSectionClass} animate-reveal`}>
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
            <ProgressBar step={step} setStep={setStep} />
            {/* Steps */}
            <form
              className="premium-fade-in premium-slide-in w-full max-w-lg transition-all duration-600 ease-out"
              autoComplete="off"
              onSubmit={handleContinue}
              style={{ minHeight: 420 }}
            >
              {/* --- STEP 1 --- */}
              {step === 1 && (
                <div className="premium-step-animate animate-reveal">
                  <h2 className="mb-5 text-xl font-bold uppercase tracking-wide text-white/93">
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
                      onBlur={() => handleBlur("email")}
                    />
                    {touched.email && formErrors.email && (
                      <span className="text-xs text-rose-400/91 pl-2 border-b-2 border-rose-400/72 font-semibold">
                        Valid email required
                      </span>
                    )}
                  </div>
                  <h2 className="mb-3 text-lg font-semibold tracking-wide text-white/90">
                    Shipping Address
                  </h2>
                  <div className="flex flex-col gap-5 sm:gap-4">
                    <div className="flex flex-row gap-3">
                      <div className="flex-1 flex flex-col">
                        <input
                          type="text"
                          placeholder="First Name*"
                          className={fieldClass("firstName")}
                          value={form.firstName}
                          onChange={e => setForm({ ...form, firstName: e.target.value })}
                          onBlur={() => handleBlur("firstName")}
                        />
                        {touched.firstName && formErrors.firstName && (
                          <span className="text-xs text-rose-400/91 pl-2 border-b-2 border-rose-400/91 font-semibold">
                            First name required
                          </span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <input
                          type="text"
                          placeholder="Last Name*"
                          className={fieldClass("lastName")}
                          value={form.lastName}
                          onChange={e => setForm({ ...form, lastName: e.target.value })}
                          onBlur={() => handleBlur("lastName")}
                        />
                        {touched.lastName && formErrors.lastName && (
                          <span className="text-xs text-rose-400/91 pl-2 border-b-2 border-rose-400/91 font-semibold">
                            Last name required
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Company name (optional) input removed */}
                    <div className="flex flex-col">
                      <input
                        type="text"
                        placeholder="Street address*"
                        className={fieldClass("address")}
                        value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        onBlur={() => handleBlur("address")}
                      />
                      {touched.address && formErrors.address && (
                        <span className="text-xs text-rose-400/91 pl-2 border-b-2 border-rose-400/91 font-semibold">
                          Street address required
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Apartment / Suite (optional)"
                      className={fieldClass("apt")}
                      value={form.apt}
                      onChange={e => setForm({ ...form, apt: e.target.value })}
                      onBlur={() => handleBlur("apt")}
                    />
                    <div className="flex flex-row gap-3">
                      <div className="flex-1 flex flex-col">
                        <select
                          className={fieldClass("country")}
                          value={form.country}
                          onChange={e => setForm({ ...form, country: e.target.value })}
                          onBlur={() => handleBlur("country")}
                        >
                          <option value="India">India</option>
                        </select>
                      </div>
                      <div className="flex-1 flex flex-col">
                        <input
                          type="text"
                          placeholder="City*"
                          className={fieldClass("city")}
                          value={form.city}
                          onChange={e => setForm({ ...form, city: e.target.value })}
                          onBlur={() => handleBlur("city")}
                        />
                        {touched.city && formErrors.city && (
                          <span className="text-xs text-rose-400/91 pl-2 border-b-2 border-rose-400/91 font-semibold">
                            City required
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row gap-3">
                      <div className="flex-1 flex flex-col">
                        <select
                          className={fieldClass("state")}
                          value={form.state}
                          onChange={e => setForm({ ...form, state: e.target.value })}
                          onBlur={() => handleBlur("state")}
                        >
                          <option value="">Select State*</option>
                          {INDIAN_STATES.map(state => (
                            <option value={state} key={state}>{state}</option>
                          ))}
                        </select>
                        {touched.state && formErrors.state && (
                          <span className="text-xs text-rose-400/91 pl-2 border-b-2 border-rose-400/91 font-semibold">
                            State required
                          </span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <input
                          type="text"
                          placeholder="PIN code*"
                          className={fieldClass("pin")}
                          value={form.pin}
                          maxLength={6}
                          onChange={e => {
                            // Only digits, max 6
                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setForm({ ...form, pin: val });
                          }}
                          onBlur={() => handleBlur("pin")}
                        />
                        {touched.pin && formErrors.pin && (
                          <span className="text-xs text-rose-400/91 pl-2 border-b-2 border-rose-400/91 font-semibold">
                            {form.pin.length !== 6 ? "Valid 6-digit PIN required" : "PIN code required"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <input
                        type="text"
                        placeholder="Phone number*"
                        className={fieldClass("phone")}
                        value={form.phone}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        onChange={e => {
                          // Allow only digits, up to 10 chars, but allow delete/edit freely
                          let val = e.target.value.replace(/\D/g, "");
                          if (val.length > 10) val = val.slice(0, 10);
                          setForm({ ...form, phone: val });
                        }}
                        onBlur={() => handleBlur("phone")}
                      />
                      {touched.phone && formErrors.phone && (
                        <span className="text-xs text-rose-400/91 pl-2 border-b-2 border-rose-400/71 font-semibold">
                          Valid 10-digit Indian number
                        </span>
                      )}
                    </div>
                    <div className="flex items-center mt-3">
                      <input
                        id="create-account"
                        type="checkbox"
                        checked={form.createAccount}
                        onChange={e => setForm({ ...form, createAccount: e.target.checked })}
                        className="w-4 h-4 accent-white bg-black border border-white/15 rounded-full mr-2 focus:ring-2 focus:accent-gray-200"
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
                <div className="premium-step-animate animate-reveal">
                  <h2 className="mb-5 text-xl font-bold uppercase tracking-wide text-white/93">
                    Shipping
                  </h2>
                  <AddressSummary form={form} />
                  <div className={shippingInfoClass}>
                    {/* Delivery Check Section */}
                    {deliveryCheckLoading && (
                      <div className="flex flex-col items-center justify-center py-3 gap-2 w-full">
                        <div className="w-12 h-4 rounded bg-white/15 mb-2 animate-premiumShine" />
                        <div className="text-sm text-white/70 font-semibold">Checking delivery availability…</div>
                      </div>
                    )}
                    {deliveryCheckError && (
                      <div className="text-rose-400/93 font-bold py-2">{deliveryCheckError}</div>
                    )}
                    {deliveryCheck && (
                      <div className="w-full">
                        <div className="flex items-center mb-2">
                          <span className="text-lg font-black mr-2">Serviceable:</span>
                          {deliveryCheck.serviceable ? (
                            <span className="ml-2 text-green-300/90 font-bold">✓ Delivery available</span>
                          ) : (
                            <span className="ml-2 text-rose-400/90 font-semibold">✗ Not available to this address</span>
                          )}
                        </div>
                        <div className="flex items-center mb-2">
                          <span className="text-lg font-black mr-2">Shipping Charge:</span>
                          {deliveryCheck.shippingCharge !== null ? (
                            <span className="ml-2">
                              {deliveryCheck.shippingCharge === 0 ? (
                                <span className="text-green-200/95 font-bold">Free</span>
                              ) : (
                                <span className="text-white/95 font-bold">₹{deliveryCheck.shippingCharge}</span>
                              )}
                            </span>
                          ) : (
                            <span className="ml-2 text-white/55">Unknown</span>
                          )}
                        </div>
                        <div className="flex items-center mb-2">
                          <span className="text-lg font-black mr-2">Estimated Delivery:</span>
                          {deliveryCheck.eta != null ? (
                            <span className="ml-2 text-white/95 font-semibold">{deliveryCheck.eta} {deliveryCheck.eta === 1 ? "day" : "days"}</span>
                          ) : (
                            <span className="ml-2 text-white/55">Unknown</span>
                          )}
                        </div>
                        <div className="flex items-center mb-1">
                          <span className="text-lg font-black mr-2">COD:</span>
                          {deliveryCheck.codAvailable ? (
                            <span className="ml-2 text-green-300/90 font-semibold">Available</span>
                          ) : (
                            <span className="ml-2 text-white/60 font-semibold">Not Available</span>
                          )}
                        </div>
                      </div>
                    )}
                    {!deliveryCheckLoading && !deliveryCheck && !deliveryCheckError && (
                      <>
                        <div className="mb-2 font-normal text-white/90">
                          <span className="text-lg font-black mr-2">Shipping Method:</span>
                          <span className="ml-2">Express Delivery: <span className="text-white">{shipping === 0 ? "Free" : `₹${shipping}`}</span></span>
                        </div>
                        <div className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">
                          Est. Delivery: 2–7 Days Pan India
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`
                      relative py-3.5 px-8 rounded-full font-black text-black bg-gradient-to-r from-white to-zinc-200
                      shadow-[0_10px_32px_rgba(255,255,255,0.13)]
                      overflow-hidden group transition-all duration-600 ease-out
                      tracking-widest text-[1.15rem] select-none
                      disabled:opacity-34 disabled:cursor-not-allowed
                      ${
                        itemsWithFinalPrice.length === 0 ||
                        deliveryCheckLoading ||
                        (deliveryCheck && !deliveryCheck.serviceable)
                          ? "opacity-34 cursor-not-allowed pointer-events-none"
                          : ""
                      }
                    `}
                    onClick={() =>
                      itemsWithFinalPrice.length > 0 &&
                      !deliveryCheckLoading &&
                      deliveryCheck &&
                      deliveryCheck.serviceable &&
                      setStep(3)
                    }
                    style={{
                      fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                    }}
                    disabled={
                      itemsWithFinalPrice.length === 0 ||
                      deliveryCheckLoading ||
                      (deliveryCheck && !deliveryCheck.serviceable)
                    }
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
                  {/* Back button removed */}
                  {/* Delivery creation error display in shipping step if relevant */}
                  {deliveryCreationError && (
                    <div className="mt-5 text-rose-400/90 font-bold bg-rose-900/10 rounded-lg py-2 px-4 border border-rose-400/45">{deliveryCreationError}</div>
                  )}
                </div>
              )}
              {/* --- STEP 3 (Payment) --- */}
              {step === 3 && (
                <div className="premium-step-animate animate-reveal">
                  <h2 className="mb-7 text-xl font-bold uppercase tracking-wide text-white/93">
                    Payment
                  </h2>
                  {/* Payment Method Selection */}
                  <div className="mb-7">
                    <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                      <PaymentMethodCard
                        icon={
                          <span className="inline-flex items-center justify-center w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-black/70 border border-white/20 mr-2 text-[1.55rem] text-white/95 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="28" height="28" fill="none"><rect width="44" height="44" rx="13" fill="url(#razor-cc-grad)" /><rect x="8" y="21" width="28" height="3.5" rx="1.6" fill="#fff" fillOpacity=".97"/><rect x="8" y="14.9" width="28" height="4" rx="1.5" fill="#fff" fillOpacity=".89"/><rect x="13.1" y="26.7" width="15.7" height="3.3" rx="1.1" fill="#fff" fillOpacity=".82"/><defs><linearGradient id="razor-cc-grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop stopColor="#26282b"/><stop offset="1" stopColor="#222024"/></linearGradient></defs></svg>
                          </span>
                        }
                        label="Online Payment"
                        desc="Razorpay, UPI, Cards"
                        active={paymentMethod === "online"}
                        onClick={() => setPaymentMethod("online")}
                      />
                      <PaymentMethodCard
                        icon={
                          <span className="inline-flex items-center justify-center w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-black/70 border border-white/20 mr-2 text-[1.42rem] text-white/93 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 44 44" fill="none"><rect width="44" height="44" rx="13" fill="url(#cash-grad)" /><rect x="10.5" y="18" width="23" height="12" rx="2.2" fill="#fff" fillOpacity=".93" stroke="#cbeeca" strokeWidth="2"/><rect x="16.8" y="21.4" width="9.8" height="2.9" rx="1.25" fill="#7ae67a" /><rect x="14.9" y="26.2" width="13.6" height="1.9" rx=".95" fill="#8ad08c" /><defs><linearGradient id="cash-grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop stopColor="#2b2f27"/><stop offset="1" stopColor="#233024"/></linearGradient></defs></svg>
                          </span>
                        }
                        label="Cash on Delivery"
                        desc="(COD)"
                        active={paymentMethod === "cod"}
                        onClick={() => setPaymentMethod("cod")}
                      />
                    </div>
                  </div>
                  {/* Conditional payment action buttons */}
                  <div className="flex flex-col gap-7 sm:gap-6">
                    <button
                      ref={paymentButtonRef}
                      type="button"
                      className={`
                        relative py-4 px-8 mt-2 rounded-full font-extrabold text-black bg-gradient-to-r from-white to-zinc-200
                        shadow-[0_10px_32px_rgba(255,255,255,0.13)]
                        overflow-hidden group transition-all duration-600 ease-out
                        tracking-wider text-[1.35rem] select-none
                        ${paymentMethod !== "online" || razorpayLoading || itemsWithFinalPrice.length === 0 ? "opacity-36 pointer-events-none cursor-not-allowed" : ""}
                      `}
                      style={{
                        fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                        marginBottom: "0.2rem",
                        display: paymentMethod === "online" ? undefined : "none",
                      }}
                      onClick={handlePayment}
                      disabled={paymentMethod !== "online" || razorpayLoading || itemsWithFinalPrice.length === 0}
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
                    <button
                      type="button"
                      className={`
                        relative py-4 px-8 mt-2 rounded-full font-extrabold text-black bg-gradient-to-r from-white to-zinc-200
                        shadow-[0_12px_32px_rgba(255,255,255,0.13)]
                        overflow-hidden group transition-all duration-600 ease-out
                        tracking-wider text-[1.17rem] select-none
                        ${paymentMethod !== "cod" || itemsWithFinalPrice.length === 0 ? "opacity-36 pointer-events-none cursor-not-allowed" : ""}
                      `}
                      style={{
                        fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                        display: paymentMethod === "cod" ? undefined : "none",
                      }}
                      onClick={handleCOD}
                      disabled={paymentMethod !== "cod" || itemsWithFinalPrice.length === 0}
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
                  </div>
                  {/* Delivery creation error show here if needed */}
                  {deliveryCreationError && (
                    <div className="mt-5 text-rose-400/90 font-bold bg-rose-900/10 rounded-lg py-2 px-4 border border-rose-400/45">{deliveryCreationError}</div>
                  )}
                </div>
              )}
            </form>
          </section>
          {/* --- RIGHT ORDER SUMMARY --- */}
          <aside className="w-full md:w-[35%] max-w-lg sticky top-10 self-start">
            <div className={`${asideCardClass} animate-reveal`}>
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
              <div className={`my-8 border-t border-white/12 pt-6 space-y-4 text-[1.07rem] font-semibold leading-tight`}>
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
                  <div className={`flex justify-between items-center text-green-300/90 font-bold`}>
                    <span className="font-semibold tracking-wide">Coupon Discount</span>
                    <span className="text-green-200/92 font-bold">-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className={`flex items-center justify-between pt-3 mt-3 border-t border-white/15`}>
                  {/* TOTAL LABEL */}
                  <span
                    className={`text-white/90 tracking-widest font-extrabold
                      text-sm sm:text-base
                      leading-none select-none`}
                  >
                    Total
                  </span>

                  {/* TOTAL AMOUNT */}
                  <span
                    className={`tracking-widest font-extrabold
                      text-lg sm:text-xl
                      bg-gradient-to-r from-white via-zinc-100 to-white/80
                      bg-clip-text text-transparent
                      leading-none
                      transition-transform duration-300
                      hover:scale-[1.03]`}
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
      <style jsx global>{`
        /* Payment Method Card Animations */
        .payment-method-card:focus-visible,
        .payment-method-card:focus {
          outline: 2px solid #fff;
        }
      `}</style>
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

      /* Custom fade for AddressSummary */
      @keyframes premiumFadeIn {
        from { opacity: 0; transform: scale(0.983) translateY(16px);}
        to { opacity: 1; transform: none;}
      }
      .animate-premiumFadeIn {
        animation: premiumFadeIn 0.93s cubic-bezier(.4,0,.2,1);
      }

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