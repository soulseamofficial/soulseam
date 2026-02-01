"use client";

import { useRef, useState, useEffect } from "react";
import { useCart } from "../CartContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import MobileCheckoutHeader from "../components/MobileCheckoutHeader";
import OrderSuccessModal from "../components/OrderSuccessModal";

// CONSTANTS (unchanged)
const premiumCardClass = `
  premium-info-card w-full
  bg-gradient-to-b from-black/80 via-zinc-900/68 to-black/99
  border border-white/14 rounded-3xl
  px-8 py-8 flex flex-col
  shadow-[0_22px_60px_rgba(255,255,255,0.12)]
  transition-all duration-600 ease-out
  will-change-transform
  group premium-summary-hover
  relative
`;

const pageCenterClass =
  "w-full min-h-screen flex flex-col items-center justify-center bg-black/95 py-32 px-5 sm:px-10";

const mainPageClass =
  "min-h-screen w-full bg-black flex flex-col pt-16 md:pt-6 pb-6 px-1 sm:px-3 justify-between";
const mainLayoutClass =
  "max-w-[1200px] w-full mx-auto flex flex-col md:flex-row items-start justify-between gap-9 md:gap-7";
const leftFormSectionClass = premiumCardClass;

const h1Class = `
  text-2xl sm:text-3xl font-black uppercase
  tracking-[0.19em] text-white/90 mb-5 leading-tight
  drop-shadow-[0_4px_22px_rgba(255,255,255,0.18)]
  bg-gradient-to-r from-white via-white/90 to-zinc-200/70 bg-clip-text text-transparent
`;

const sectionTitleClass = `
  mb-5 text-xl font-black uppercase tracking-[0.19em]
  bg-gradient-to-r from-white via-white/90 to-zinc-200/70 bg-clip-text text-transparent
  leading-tight drop-shadow-[0_3px_19px_rgba(255,255,255,0.12)]
`;

const sectionSubTitleClass = `
  mb-3 text-lg font-semibold tracking-wide text-white/93 uppercase
  bg-gradient-to-r from-white via-white/93 to-zinc-200/73 bg-clip-text text-transparent
  leading-tight
`;

const shippingInfoClass = `
  w-full bg-gradient-to-b from-white/5 to-white/0 border border-white/8 rounded-2xl px-6 py-5 mb-8 flex flex-col items-start shadow-[0_6px_18px_rgba(255,255,255,0.06)] transition-all duration-600 ease-out
`;
const asideCardClass = premiumCardClass;

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
  "Jammu and Kashmir","Ladakh"
];

// --- Progress Bar ---
const ProgressBar = ({ step, setStep }) => {
  const router = useRouter();

  const progress = ["Cart", "Information", "Shipping", "Payment"];
  const canGoToShipping = true;
  const canGoToPayment = step >= 2;

  return (
    <nav aria-label="Progress" className="mb-10 sm:mb-8">
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
              <span className="mx-2 w-4 h-[2px] bg-white/30" />
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
    <div className={checkoutProductCardClass}>
      <div className={`${checkoutProductCardImgClass} productCardImg`}>
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
            transition:
              "transform .62s cubic-bezier(.42,0,.28,1), box-shadow .59s cubic-bezier(.42,0,.28,1)"
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
        <div className="font-bold mt-1">
          ₹{(item.finalPrice ?? item.price).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

// --- Coupon Dropdown ---
function CouponDropdown({
  activeCoupons,
  appliedCoupon,
  appliedCouponCode,
  couponDiscount,
  couponError,
  onCouponSelect,
  onRemoveCoupon,
  loading
}) {
  const formatCouponOption = (coupon) => {
    const benefit = coupon.discountType === "flat"
      ? `Save ₹${coupon.discountValue}`
      : `Get ${coupon.discountValue}% off`;
    return `${coupon.code} — ${benefit}`;
  };

  if (activeCoupons.length === 0 && !appliedCoupon) {
    return (
      <div className="mt-4">
        <p className="text-white/60 text-sm font-medium">
          No offers available right now
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {appliedCoupon && appliedCouponCode && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-green-500/10 border border-green-400/30">
            <div className="flex items-center gap-2">
              <span className="text-green-300/90 text-sm font-bold">✔</span>
              <span className="text-green-300/90 text-sm font-semibold">
                Coupon Applied: <span className="font-bold">{appliedCouponCode}</span>
              </span>
            </div>
            {onRemoveCoupon && (
              <button
                type="button"
                onClick={onRemoveCoupon}
                className="px-3 py-1.5 text-xs font-bold text-blue-300 hover:text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-400/30 hover:border-blue-400/50 rounded-lg transition-all duration-300"
              >
                Change Coupon
              </button>
            )}
          </div>
          {couponDiscount > 0 && (
            <div className="p-3 rounded-xl bg-green-500/5 border border-green-400/20">
              <p className="text-green-300/95 text-sm font-bold">
                You saved ₹{couponDiscount.toLocaleString()} 🎉
              </p>
            </div>
          )}
        </div>
      )}
      
      {!appliedCoupon && (
        <div className="relative">
          <label className="block text-sm font-semibold text-white/90 mb-2">
            Apply Coupon
          </label>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value && onCouponSelect) {
                onCouponSelect(e.target.value);
              }
            }}
            disabled={appliedCoupon || loading}
            className={`
              w-full rounded-2xl px-4 py-2.5 bg-black/85 border border-white/15 text-white
              font-semibold outline-none ring-0
              transition-all duration-600 ease-out
              focus:ring-2 focus:ring-white/20 focus:border-white/40 focus:bg-black/80
              hover:border-white/25
              ${appliedCoupon || loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
              ${couponError ? "border-red-400/50 focus:border-red-400/70" : ""}
            `}
            style={{
              fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
            }}
          >
            <option value="" disabled>
              Select an available offer
            </option>
            {activeCoupons.map((coupon) => (
              <option key={coupon.code} value={coupon.code}>
                {formatCouponOption(coupon)}
              </option>
            ))}
          </select>
          {couponError && (
            <span className="mt-2 block text-sm font-semibold text-red-400 animate-premiumPulse">
              {couponError}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ---- OTP Verification UI ------

function AnimatedPasswordFields({ visible, password, setPassword, confirm, setConfirm, error }) {
  return (
    <div className={`
      ${visible ? "animate-premiumSlideFadeIn" : "pointer-events-none opacity-0 absolute"}
      mt-4 mb-2 w-full flex flex-col gap-3 transition-all duration-700
    `}>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Create Password*"
        className={`
          premium-input w-full rounded-2xl px-4 py-2 sm:py-2.5 bg-black/85 border border-white/18 text-white/93 font-semibold placeholder:text-white/35 transition-all duration-500 outline-none focus:bg-black/75 focus:border-white/40 focus:ring-2 focus:ring-white/20 hover:border-white/30 ring-0
        `}
        style={{ fontFamily: "Inter,Poppins,Neue Haas,sans-serif" }}
        minLength={6}
        autoComplete="new-password"
      />
      <input
        type="password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        placeholder="Confirm Password*"
        className={`
          premium-input w-full rounded-2xl px-4 py-2 sm:py-2.5 bg-black/85 border border-white/18 text-white/93 font-semibold placeholder:text-white/35 transition-all duration-500 outline-none focus:bg-black/75 focus:border-white/40 focus:ring-2 focus:ring-white/20 hover:border-white/30 ring-0
        `}
        style={{ fontFamily: "Inter,Poppins,Neue Haas,sans-serif" }}
        minLength={6}
        autoComplete="new-password"
      />
      {error && (
        <span className="text-xs font-bold text-rose-400/95 mt-1 pl-2">{error}</span>
      )}
    </div>
  );
}

function VerificationCard({
  method,
  icon,
  label,
  active,
  completed,
  step,
  inputValue,
  setInputValue,
  otp,
  setOtp,
  loading,
  error,
  onSelect,
  onSendOtp,
  onVerifyOtp,
  methodDisabled,
  lockOtherCard,
  inputDisabled,
  showPasswordFields,
  passwordFields,
  setPasswordFields,
  passwordError,
}) {
  return (
    <div
      className={`
      flex-1 basis-0 min-w-0 max-w-full
      px-5 py-6 rounded-2xl
      bg-gradient-to-b from-white/10 to-white/0
      border border-white/15
      shadow-[0_20px_80px_rgba(255,255,255,0.13)]
      relative transition-all duration-600 ease-out
      hover:-translate-y-2 hover:shadow-[0_32px_100px_rgba(255,255,255,0.20)]
      hover:border-white/30
      will-change-transform
      cursor-pointer
      group
      ${active ? "scale-[1.03] border-white shadow-[0_28px_110px_rgba(255,255,255,0.22)]" : ""}
      ${completed ? "border-green-300/80" : ""}
      ${lockOtherCard && !active ? "opacity-60" : ""}
    `}
      style={{
        fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
        outline: active ? "2px solid #fff" : undefined,
        minHeight: 0,
      }}
      tabIndex={0}
      aria-pressed={active}
      onClick={() => !completed && !methodDisabled && onSelect(method)}
      role="button"
    >
      <div className="flex items-center mb-2 w-full">
        {/* Icon */}
        <span className="inline-flex items-center justify-center w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-black/70 border border-white/20 text-[1.49rem] text-white/95 shadow-sm mr-3">
          {icon}
        </span>
        <span
          className={`font-bold text-[1.13rem] tracking-wide ${
            active ? "text-white" : "text-white/93"
          }`}
        >
          {label}
        </span>
        <div className="ml-auto" />
        {completed && (
          <span className="ml-auto text-green-300/90 font-extrabold tracking-wider text-xl select-none animate-premiumPulse">
            &#10003;
          </span>
        )}
      </div>
      {/* Body: Step-controlled fields */}
      {!completed && active && (
        <div className="w-full mt-1 transition-all duration-500 ease-out">
          {step === "idle" && (
            <>
              <div className="flex flex-col gap-2 w-full items-start">
                <input
                  type={method === "whatsapp" ? "text" : "email"}
                  inputMode={method === "whatsapp" ? "numeric" : "email"}
                  pattern={method === "whatsapp" ? "[0-9]*" : undefined}
                  placeholder={method === "whatsapp" ? "Phone number" : "Email address"}
                  value={inputValue}
                  onChange={e => {
                    let val = e.target.value;
                    if (method === "whatsapp") {
                      val = val.replace(/\D/g, "").slice(0, 10);
                    }
                    setInputValue(val);
                  }}
                  className={`
                    w-full rounded-2xl px-4 py-2 bg-black/85 border border-white/18 text-white/93 font-semibold
                    placeholder:text-white/38 outline-none ring-0
                    focus:ring-2 focus:ring-white/20 focus:border-white/46
                    hover:border-white/25
                    transition-all duration-600 ease-out
                    ${loading || inputDisabled ? "opacity-60 cursor-not-allowed" : ""}
                  `}
                  style={{
                    fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                    letterSpacing: '0.03em',
                    fontSize: '1.04rem'
                  }}
                  disabled={loading || inputDisabled}
                  autoComplete="off"
                />
                <button
                  type="button"
                  disabled={
                    loading ||
                    (method === "whatsapp"
                      ? inputValue.length !== 10
                      : !inputValue ||
                          !/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(inputValue))
                  }
                  className={`
                    mt-2 ml-0 self-start rounded-full bg-gradient-to-r from-white/80 via-zinc-100/90 to-white/60 text-black/80 text-xs font-bold
                    shadow-[0_0_0_1px_rgba(255,255,255,0.22)]
                    px-4 py-1.5 transition-all duration-500 ease-out
                    hover:from-white hover:to-zinc-200/90 hover:text-black
                    hover:shadow-[0_8px_18px_rgba(255,255,255,0.10)]
                    focus:ring-2 focus:ring-white/30 focus:scale-99
                    disabled:opacity-35 disabled:cursor-not-allowed
                    premium-send-otp-btn
                  `}
                  style={{
                    fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                    minWidth: 84,
                  }}
                  onClick={onSendOtp}
                >
                  {loading ? (
                    <span className="relative z-10 flex items-center transition-all duration-600 ease-out">
                      <span className="w-4 h-4 mr-2 rounded-full border-2 border-white/40 border-t-transparent animate-spin"></span>
                      Sending…
                    </span>
                  ) : (
                    <span className="relative z-10 flex items-center transition-all duration-600 ease-out">
                      Send OTP
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
          {step === "otp_sent" && (
            <>
              <div className="flex flex-col gap-0 w-full mt-0">
                <div className="flex flex-row items-center gap-2 w-full animate-premiumFadeIn">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={`
                      w-[106px] rounded-2xl px-4 py-2 bg-black/85 border border-white/24 text-white font-semibold mr-2
                      placeholder:text-white/33 outline-none ring-0
                      focus:ring-2 focus:ring-white/20 focus:border-white/40
                      hover:border-white/25
                      transition-all duration-600 ease-out
                      text-[1.09rem]
                      ${loading ? "opacity-60 cursor-not-allowed" : ""}
                    `}
                    style={{
                      fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                      letterSpacing: '0.09em'
                    }}
                    disabled={loading}
                    autoComplete="one-time-code"
                  />
                  <button
                    type="button"
                    disabled={loading || otp.length !== 6}
                    className={`
                      relative px-3.5 py-2 rounded-full font-black text-black/90 text-xs bg-gradient-to-r from-white/88 to-zinc-200/94
                      shadow-[0_4px_16px_rgba(255,255,255,0.13)]
                      overflow-hidden group transition-all duration-600 ease-out
                      focus:ring-2 focus:ring-white/20 focus:scale-98
                      disabled:opacity-40 disabled:cursor-not-allowed
                      premium-verify-btn
                    `}
                    style={{
                      fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                      minWidth: 72,
                    }}
                    onClick={onVerifyOtp}
                  >
                    {loading ? (
                      <span className="relative z-10 flex items-center transition-all duration-600 ease-out">
                        <span className="w-3.5 h-3.5 mr-2 rounded-full border-2 border-white/40 border-t-transparent animate-spin"></span>
                        Verifying
                      </span>
                    ) : (
                      <span className="relative z-10 flex items-center transition-all duration-600 ease-out">
                        Verify
                      </span>
                    )}
                  </button>
                </div>
                <div className="mt-1 text-xs text-white/60 leading-tight font-medium select-none">
                  Enter the 6-digit OTP sent to your {method === "whatsapp" ? "WhatsApp" : "email"}.
                </div>
              </div>
            </>
          )}
          {showPasswordFields && (
            <AnimatedPasswordFields
              visible
              password={passwordFields.password}
              setPassword={v => setPasswordFields(f => ({ ...f, password: v }))}
              confirm={passwordFields.confirm}
              setConfirm={v => setPasswordFields(f => ({ ...f, confirm: v }))}
              error={passwordError}
            />
          )}
          {error && (
            <div className="mt-2 text-xs text-rose-400/92 font-bold">{error}</div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Address Summary (Shipping Step) ---
function AddressSummary({ form }) {
  // Compose address lines
  const name = [form.firstName, form.lastName].filter(Boolean).join(" ");
  const streetLine = [form.address, form.apt].filter(Boolean).join(", ");
  const cityStatePin = [form.city, form.state, form.pin].filter(Boolean).join(", ");
  const phone = form.phone;

  if (!name && !streetLine && !cityStatePin && !phone) return null;
  return (
    <div
      className={`
        w-full bg-gradient-to-b from-white/10 to-white/0 border border-white/14 rounded-2xl px-6 py-5 mb-8 flex flex-col items-start shadow-[0_6px_24px_rgba(255,255,255,0.09)] transition-all duration-600 ease-out animate-premiumFadeIn
      `}
      style={{ fontFamily: "Inter,Poppins,Neue Haas,sans-serif" }}
    >
      <div className="font-bold mb-2 text-[1.04rem] uppercase tracking-wider text-white/93">Shipping Address</div>
      <div className="text-white/94 text-base font-semibold leading-tight mb-1">{name}</div>
      <div className="text-white/80 text-xs sm:text-sm font-medium mb-1">{streetLine}</div>
      <div className="text-white/80 text-xs sm:text-sm font-medium mb-1">{cityStatePin}</div>
      <div className="text-white/70 text-xs font-bold tracking-widest mt-1 select-none">+91 {phone}</div>
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
        hover:border-white/60 hover:scale-[1.018] hover:shadow-[0_14px_36px_rgba(255,255,255,0.18)]
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
      <div className="flex items-center">{icon}</div>
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

// NEW: Hook to manage animated password fields in verification flow
function usePasswordVerification(accountEnabled, step) {
  const [passwordFields, setPasswordFields] = useState({ password: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  useEffect(() => {
    if (!accountEnabled || step !== "verified") {
      setPasswordFields({ password: "", confirm: "" });
      setPasswordError("");
    }
    // The original used eslint-disable-next-line react-hooks/set-state-in-effect,
    // but this is a safe usage as documented in React.
  }, [accountEnabled, step]);
  return { passwordFields, setPasswordFields, passwordError, setPasswordError };
}

// --- Discount (was missing from right summary if coupon applied) ---
const discount = 0;

// --- MAIN PAGE ---
export default function CheckoutPage() {
  // All code here is unchanged except discount definition added above and error fixes below.
  const { cartItems, clearCart } = useCart();
  const router = useRouter();

  // Steps and form (unchanged)
  const [step, setStep] = useState(1); // 1 = Info, 2 = Shipping, 3 = Payment
  const [authUser, setAuthUser] = useState(null);
  const [guestSessionId, setGuestSessionId] = useState(null);
  const [guestUserId, setGuestUserId] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    apt: "",
    city: "",
    state: "",
    pin: "",
    phone: "",
    country: "India",
    createAccount: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(false);
  const [showCouponSuccess, setShowCouponSuccess] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [firstOrderCoupon, setFirstOrderCoupon] = useState(null);
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);
  // State for order totals (trust backend finalTotal)
  // These will be initialized in useEffect when cart is loaded
  const [orderSubtotal, setOrderSubtotal] = useState(0);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("not_selected");
  const paymentButtonRef = useRef(null);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [deliveryCheck, setDeliveryCheck] = useState(null);
  const [deliveryCheckLoading, setDeliveryCheckLoading] = useState(false);
  const [deliveryCheckError, setDeliveryCheckError] = useState(null);
  const [deliveryCreationError, setDeliveryCreationError] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  
  // COD Advance Payment State
  const [codSettings, setCodSettings] = useState({ codAdvanceEnabled: false, codAdvanceAmount: 100 });
  const [codAdvancePaid, setCodAdvancePaid] = useState(false);
  const [codAdvanceLoading, setCodAdvanceLoading] = useState(false);
  const [codAdvancePaymentId, setCodAdvancePaymentId] = useState(null);
  const [codAdvanceOrderId, setCodAdvanceOrderId] = useState(null);
  const [codAdvanceSignature, setCodAdvanceSignature] = useState(null);

  // Order Success Modal State
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [successPaymentMethod, setSuccessPaymentMethod] = useState("COD");

  // Auth + guest session bootstrap (checkout must never block)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sid = localStorage.getItem("guestSessionId") || crypto?.randomUUID?.() || String(Date.now());
    localStorage.setItem("guestSessionId", sid);
    setGuestSessionId(sid);
    const g = localStorage.getItem("guestUserId");
    if (g) setGuestUserId(g);
    fetch("/api/auth/user/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setAuthUser(data.user);
          setSavedAddresses(Array.isArray(data.user.addresses) ? data.user.addresses : []);
          // Auto-select first saved address (user can change in Shipping step)
          const first = Array.isArray(data.user.addresses) ? data.user.addresses[0] : null;
          if (first?._id) setSelectedAddressId(first._id);
          // Autofill core identity (shipping fields are managed separately for logged-in address selection)
          setForm((f) => ({
            ...f,
            email: data.user.email || f.email,
            phone: data.user.phone || f.phone,
            firstName: (data.user.name || "").split(" ")[0] || f.firstName,
            lastName: (data.user.name || "").split(" ").slice(1).join(" ") || f.lastName,
            createAccount: false,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch active coupons
  useEffect(() => {
    async function fetchActiveCoupons() {
      try {
        setCouponLoading(true);
        const res = await fetch("/api/coupons/active");
        const data = await res.json();
        if (Array.isArray(data)) {
          setActiveCoupons(data);
          console.log("[Checkout] Active coupons fetched:", data.length);
        } else {
          console.error("[Checkout] Invalid response from active coupons API");
          setActiveCoupons([]);
        }
      } catch (err) {
        console.error("[Checkout] Failed to fetch active coupons:", err);
        setActiveCoupons([]);
      } finally {
        setCouponLoading(false);
      }
    }
    fetchActiveCoupons();
  }, [authUser]); // Re-fetch when auth state changes (for first-order eligibility)

  // Fetch COD settings
  useEffect(() => {
    async function fetchCodSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success && data.settings) {
          setCodSettings(data.settings);
        }
      } catch (err) {
        console.error("[Checkout] Failed to fetch COD settings:", err);
      }
    }
    fetchCodSettings();
  }, []);

  // Note: First-order coupon eligibility is now handled by the backend API
  // The dropdown will only show coupons the user is eligible for

  async function refreshSavedAddresses() {
    try {
      const res = await fetch("/api/users/addresses", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data?.addresses) ? data.addresses : [];
      setSavedAddresses(list);
      if (!selectedAddressId && list[0]?._id) setSelectedAddressId(list[0]._id);
    } catch {
      // ignore
    }
  }

  async function saveNewAddressToUser() {
    try {
      const res = await fetch("/api/users/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newAddress),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window?.alert?.(data?.message || "Could not save address");
        return false;
      }
      setShowAddAddress(false);
      await refreshSavedAddresses();
      return true;
    } catch {
      window?.alert?.("Could not save address");
      return false;
    }
  }

  // --- ACCOUNT CREATE/OTP/VERIFICATION ---
  const [verificationMethod, setVerificationMethod] = useState(null); // "whatsapp" | "email" | null
  const [verificationStep, setVerificationStep] = useState("idle");   // "idle" | "otp_sent" | "verified"
  const [verificationInput, setVerificationInput] = useState("");      // phone/email
  const [verificationOtp, setVerificationOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSentMessage, setOtpSentMessage] = useState(""); // Inline message after OTP sent
  const [resendCooldown, setResendCooldown] = useState(0); // Resend cooldown timer
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  // --- Visual selection for contact method (UI only, no functionality) ---
  const [selectedContactMethod, setSelectedContactMethod] = useState(null); // "whatsapp" | "email" | null
  // --- Password fields for account create after OTP verified
  const { passwordFields, setPasswordFields, passwordError, setPasswordError } =
    usePasswordVerification(form.createAccount, verificationStep);

  useEffect(() => {
    setVerificationInput("");
    setVerificationOtp("");
    setOtpError("");
    setVerificationStep("idle");
    // (Password fields reset in custom hook)
  }, [verificationMethod, form.createAccount]);
  useEffect(() => {
    if (!form.createAccount) {
      // Reset all OTP-related state when account creation is disabled
      setVerificationMethod(null);
      setVerificationStep("idle");
      setVerificationInput("");
      setVerificationOtp("");
      setOtpLoading(false);
      setOtpError("");
      setOtpSentMessage("");
      setSelectedContactMethod(null);
      setWhatsappVerified(false);
      setEmailVerified(false);
      setResendCooldown(0);
    }
  }, [form.createAccount]);

  useEffect(() => {
    async function handleDeliveryCheck() {
      if (step !== 2) return;
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

        // Delivery check complete - no need to update order at this stage
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form.pin, form.address, form.city, form.state, form.country]);

  // SSR-safe
  const itemsWithFinalPrice = mounted
    ? cartItems.map(item => ({
        ...item,
        finalPrice: item.finalPrice ?? item.price
      }))
    : [];

  // Calculate subtotal from cart items
  const calculatedSubtotal =
    itemsWithFinalPrice.reduce(
      (sum, item) => sum + (item.finalPrice ?? item.price) * item.quantity,
      0
    );

  // Initialize order totals when cart changes or on mount
  useEffect(() => {
    if (mounted) {
      // Always update subtotal from cart calculation
      const newSubtotal = calculatedSubtotal;
      setOrderSubtotal(newSubtotal);
      // If no coupon applied, reset discount and total
      if (!appliedCoupon) {
        setOrderDiscount(0);
        setOrderTotal(newSubtotal);
      } else {
        // If coupon is applied, keep discount but update subtotal reference
        // Total remains from backend finalTotal
      }
    }
  }, [mounted, calculatedSubtotal, appliedCoupon]);

  const shipping =
    orderSubtotal > 15000
      ? 0
      : orderSubtotal === 0
      ? 0
      : 0;

  // Use state values for display (trust backend finalTotal)
  // Fallback to calculated values if state not initialized yet
  const subtotal = orderSubtotal > 0 ? orderSubtotal : calculatedSubtotal;
  const discount = orderDiscount;
  // Total = backend finalTotal + shipping (or calculated if no coupon applied)
  const total = orderTotal > 0 ? orderTotal + shipping : (calculatedSubtotal + shipping - discount);

  async function handleApplyCoupon(code) {
    // Support both event (legacy) and direct code parameter
    if (code && typeof code.preventDefault === 'function') {
      code.preventDefault();
      code = couponCode.trim();
    } else if (typeof code === 'string') {
      code = code.trim();
    } else {
      code = couponCode.trim();
    }

    if (appliedCoupon) return;

    if (!code) {
      setCouponError("Please select a coupon");
      setShowCouponSuccess(false);
      return;
    }

    setCouponError("");
    setShowCouponSuccess(false);
    setCouponLoading(true);

    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          cartTotal: orderSubtotal > 0 ? orderSubtotal : calculatedSubtotal,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCouponError(data.error || "Failed to apply coupon");
        setShowCouponSuccess(false);
        setAppliedCoupon(false);
        setCouponDiscount(0);
        setOrderDiscount(0);
        setOrderTotal(orderSubtotal || calculatedSubtotal); // Reset to original subtotal
        setAppliedCouponCode("");
        return;
      }

      // Successfully applied - trust backend finalTotal
      setAppliedCoupon(true);
      setCouponDiscount(data.discountAmount);
      setAppliedCouponCode(code.toUpperCase().trim());
      // Update order totals from backend response
      setOrderDiscount(data.discountAmount);
      setOrderTotal(Math.max(0, data.finalTotal)); // Use backend finalTotal, ensure >= 0
      setShowCouponSuccess(true);
      setTimeout(() => setShowCouponSuccess(false), 3000);
    } catch (err) {
      console.error("Coupon apply error:", err);
      setCouponError("Failed to apply coupon. Please try again.");
      setShowCouponSuccess(false);
      setAppliedCoupon(false);
      setCouponDiscount(0);
      setOrderDiscount(0);
      setOrderTotal(orderSubtotal || calculatedSubtotal); // Reset to original subtotal
      setAppliedCouponCode("");
    } finally {
      setCouponLoading(false);
    }
  }

  // Handle coupon selection from dropdown (auto-apply)
  function handleCouponSelect(code) {
    if (!code || appliedCoupon) return;
    handleApplyCoupon(code);
  }

  function handleRemoveCoupon() {
    // Reset discount to 0
    setCouponDiscount(0);
    setOrderDiscount(0);
    // Reset total to subtotal
    setOrderTotal(orderSubtotal || calculatedSubtotal);
    // Reset coupon state
    setAppliedCoupon(false);
    setCouponCode("");
    setAppliedCouponCode("");
    setCouponError("");
    setShowCouponSuccess(false);
    // Re-fetch active coupons to refresh the dropdown
    fetch("/api/coupons/active")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setActiveCoupons(data);
        }
      })
      .catch((err) => console.error("Failed to refresh coupons:", err));
  }

  async function upsertGuestUser(shippingAddressSnapshot) {
    // Guest user upsert (idempotent) if not logged in
    let gId = guestUserId;
    if (!authUser) {
      try {
        const gres = await fetch("/api/checkout/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestSessionId,
            name: [form.firstName, form.lastName].filter(Boolean).join(" "),
            email: form.email,
            phone: form.phone,
            shippingAddress: shippingAddressSnapshot,
          }),
        });
        const gdata = await gres.json();
        if (gres.ok && gdata?.guestUserId) {
          gId = gdata.guestUserId;
          setGuestUserId(gId);
          localStorage.setItem("guestUserId", gId);
        }
      } catch {
        // never block checkout
      }
    }
    return gId;
  }

  function fieldRequired(key) {
    // Logged-in users choose shipping address in Shipping step (addresses array),
    // so we don't require address fields on Information step.
    if (authUser) {
      return !["apt", "address", "city", "state", "pin", "country"].includes(key);
    }
    return key !== "apt";
  }
  function validateField(field, value) {
    switch (field) {
      case "email":
        if (!value || !/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(value)) return "Valid email required";
        break;
      case "firstName": if (!value) return "First name required"; break;
      case "lastName": if (!value) return "Last name required"; break;
      case "address": if (!value) return "Street address required"; break;
      case "city": if (!value) return "City required"; break;
      case "state": if (!value) return "State required"; break;
      case "pin":
        if (!value) return "PIN code required";
        if (!/^\d{6}$/.test(value)) return "Valid 6-digit PIN required";
        break;
      case "phone":
        if (!value) return "Phone number required";
        if (!/^[6-9]\d{9}$/.test(value)) return "Valid 10-digit Indian number";
        break;
      default: return "";
    }
    return "";
  }
  function handleBlur(field) {
    setTouched(t => ({ ...t, [field]: true }));
    const error = validateField(field, form[field]);
    setFormErrors(errors => ({
      ...errors,
      [field]: error ? true : undefined
    }));
  }

  // --- OTP Handlers ---
  async function sendOTP(channel, identifier) {
    setOtpLoading(true);
    setOtpError("");
    try {
      const endpoint = channel === "whatsapp" 
        ? "/api/auth/whatsapp/send-otp" 
        : "/api/auth/email/send-otp";
      const payload = channel === "whatsapp" 
        ? { phone: identifier } 
        : { email: identifier };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = data.message || `Failed to send ${channel === "whatsapp" ? "WhatsApp" : "Email"} OTP. Please try again.`;
        setOtpError(errorMessage);
        setOtpLoading(false);
        return false;
      }

      // Set verification state
      setVerificationMethod(channel);
      setVerificationInput(identifier);
      setVerificationStep("otp_sent");
      setOtpSentMessage(`Verification code sent via ${channel === "whatsapp" ? "WhatsApp" : "Email"}`);
      
      // Start resend cooldown (30 seconds)
      setResendCooldown(30);
      const cooldownInterval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setOtpLoading(false);
      return true;
    } catch (err) {
      setOtpError("Network issue. Please try again.");
      setOtpLoading(false);
      return false;
    }
  }

  async function verifyOTP(channel, identifier, otp) {
    setOtpLoading(true);
    setOtpError("");
    try {
      const endpoint = channel === "whatsapp" 
        ? "/api/auth/whatsapp/verify-otp" 
        : "/api/auth/email/verify-otp";
      const payload = channel === "whatsapp" 
        ? { phone: identifier, otp } 
        : { email: identifier, otp };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.verified) {
        setOtpError(data.message || "Invalid OTP. Please check and try again.");
        setOtpLoading(false);
        return false;
      }

      // Mark as verified
      if (channel === "whatsapp") {
        setWhatsappVerified(true);
      } else {
        setEmailVerified(true);
      }
      setVerificationStep("verified");
      setOtpError("");
      setOtpLoading(false);
      return true;
    } catch (err) {
      setOtpError("Verification failed. Please try again.");
      setOtpLoading(false);
      return false;
    }
  }

  // Auto-trigger OTP when Continue/Place Order is clicked
  async function triggerOTPVerification() {
    const channels = [];
    if (selectedContactMethod === "whatsapp" && form.phone) {
      channels.push({ channel: "whatsapp", identifier: form.phone.replace(/\D/g, "").slice(0, 10) });
    }
    if (selectedContactMethod === "email" && form.email) {
      channels.push({ channel: "email", identifier: form.email.trim().toLowerCase() });
    }
    // If both selected, send to both
    if (selectedContactMethod === null && form.phone && form.email) {
      // Default: send to both if no selection
      channels.push({ channel: "whatsapp", identifier: form.phone.replace(/\D/g, "").slice(0, 10) });
      channels.push({ channel: "email", identifier: form.email.trim().toLowerCase() });
    }

    if (channels.length === 0) {
      return true; // No OTP required
    }

    // Send OTPs to all selected channels
    const results = await Promise.all(
      channels.map(({ channel, identifier }) => sendOTP(channel, identifier))
    );

    // Update message if multiple channels
    if (channels.length > 1) {
      setOtpSentMessage("Verification code sent via WhatsApp and Email");
    }

    return results.some(r => r); // Return true if at least one succeeded
  }

  // --- OTP Verification Status ---
  // Check if OTP verification is required and completed
  // OTP is ONLY required when user explicitly selects "Create an account" checkbox
  const isOTPVerificationRequired = form.createAccount && (form.phone || form.email);
  // If both channels selected, at least one must be verified
  // If single channel selected, that channel must be verified
  const isOTPVerified = 
    selectedContactMethod === "whatsapp" ? whatsappVerified :
    selectedContactMethod === "email" ? emailVerified :
    selectedContactMethod === null && form.phone && form.email ? (whatsappVerified || emailVerified) :
    form.phone ? whatsappVerified :
    form.email ? emailVerified :
    true; // No OTP required if no phone/email

  // Allow continue if items exist and either:
  // - OTP not required (guest checkout or account creation disabled), OR
  // - OTP not sent yet (will be triggered on submit), OR  
  // - OTP is verified
  // Disable only if OTP was sent but not verified (waiting for user input)
  // Note: OTP is only required when form.createAccount === true
  const canContinueToShipping =
    itemsWithFinalPrice.length > 0 && 
    (!isOTPVerificationRequired || 
     verificationStep === "idle" || 
     isOTPVerified || 
     verificationStep === "verified");

  async function handleContinue(e) {
    e.preventDefault();
    // Mark all as touched (for error display)
    const withTouched = {};
    Object.keys(form).forEach(key => (withTouched[key] = true));
    setTouched(withTouched);
    const errors = {};
    const errorMsgs = {};
    Object.keys(form).forEach(field => {
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

    // OTP verification is ONLY required when user explicitly selects "Create an account"
    // Guest checkout should proceed without OTP
    if (form.createAccount) {
      // Auto-trigger OTP verification if not already verified
      if (isOTPVerificationRequired && !isOTPVerified && verificationStep !== "otp_sent") {
        const otpSent = await triggerOTPVerification();
        if (!otpSent) {
          setOtpError("Failed to send verification code. Please try again.");
          return;
        }
        // Don't proceed - wait for user to verify OTP
        return;
      }

      // If OTP is sent but not verified, don't proceed
      if (verificationStep === "otp_sent" && !isOTPVerified) {
        setOtpError("Please verify the OTP before continuing.");
        return;
      }
    }
    // If createAccount is false, skip OTP entirely and proceed to shipping

    // Per spec: draft is created/updated on Shipping -> Continue (not here).
    setStep(2);
  }

  function validateInfo() {
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

  // Handle COD advance payment
  async function handleCODAdvancePayment() {
    if (!codSettings.codAdvanceEnabled) {
      return; // Advance not required
    }

    setCodAdvanceLoading(true);
    setDeliveryCreationError(null);

    try {
      // Create Razorpay order for advance payment
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: codSettings.codAdvanceAmount,
          orderType: "cod_advance",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.orderId) {
        window?.alert?.(data?.error || "Failed to initialize advance payment. Please try again.");
        setCodAdvanceLoading(false);
        return;
      }

      if (typeof window === "undefined") {
        setCodAdvanceLoading(false);
        return;
      }

      // Open Razorpay popup
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "SOULSEAM",
        description: `COD Advance Payment - ₹${codSettings.codAdvanceAmount}`,
        order_id: data.orderId,
        handler: async function (response) {
          // Store payment details
          setCodAdvancePaymentId(response.razorpay_payment_id);
          setCodAdvanceOrderId(response.razorpay_order_id);
          setCodAdvanceSignature(response.razorpay_signature);
          setCodAdvancePaid(true);
          setCodAdvanceLoading(false);
        },
        prefill: {
          name: [form.firstName, form.lastName].filter(Boolean).join(" ") || "Customer",
          email: form.email || authUser?.email || "",
          contact: form.phone || authUser?.phone || "",
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: function() {
            setCodAdvanceLoading(false);
          },
        },
      };

      // Ensure Razorpay is loaded
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          if (window.Razorpay) {
            new window.Razorpay(options).open();
          } else {
            window?.alert?.("Failed to load payment gateway. Please try again.");
            setCodAdvanceLoading(false);
          }
        };
        script.onerror = () => {
          window?.alert?.("Failed to load payment gateway. Please try again.");
          setCodAdvanceLoading(false);
        };
        document.body.appendChild(script);
      } else {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (err) {
      console.error("COD advance payment error:", err);
      window?.alert?.("Failed to initialize advance payment. Please try again.");
      setCodAdvanceLoading(false);
    }
  }

  async function handleCOD() {
    setDeliveryCreationError(null);

    // OTP verification is ONLY required when user explicitly selects "Create an account"
    // Guest checkout should proceed without OTP
    if (form.createAccount) {
      // Check OTP verification before placing order
      if (isOTPVerificationRequired && !isOTPVerified && verificationStep !== "otp_sent") {
        const otpSent = await triggerOTPVerification();
        if (!otpSent) {
          setOtpError("Failed to send verification code. Please try again.");
          return;
        }
        window?.alert?.("Please verify the OTP before placing your order.");
        return;
      }

      if (verificationStep === "otp_sent" && !isOTPVerified) {
        window?.alert?.("Please verify the OTP before placing your order.");
        return;
      }
    }
    // If createAccount is false, skip OTP entirely and proceed with order

    // Check if advance payment is required and not paid
    if (codSettings.codAdvanceEnabled && !codAdvancePaid) {
      window?.alert?.(`To confirm your Cash On Delivery order, please pay ₹${codSettings.codAdvanceAmount} as advance.`);
      return;
    }

    try {
      const shippingAddressSnapshot = {
        fullName: [form.firstName, form.lastName].filter(Boolean).join(" "),
        phone: form.phone,
        addressLine1: form.address,
        addressLine2: form.apt,
        city: form.city,
        state: form.state,
        pincode: form.pin,
        country: form.country,
      };

      // Ensure guest user exists if not logged in
      const gId = await upsertGuestUser(shippingAddressSnapshot);

      // Ensure items are available - use cartItems directly if itemsWithFinalPrice is empty
      let itemsToSend = [];
      
      if (itemsWithFinalPrice.length > 0) {
        itemsToSend = itemsWithFinalPrice;
      } else if (cartItems.length > 0) {
        // Map cartItems to ensure they have all required fields
        itemsToSend = cartItems.map(item => ({
          id: item.id || item._id || item.productId || "",
          name: item.name || "",
          image: item.image || "",
          size: item.size || "",
          color: item.color || "",
          price: item.price || 0,
          finalPrice: item.finalPrice ?? item.price ?? 0,
          quantity: item.quantity || 1,
        }));
      }

      console.log("handleCOD: Items to send", {
        itemsWithFinalPriceCount: itemsWithFinalPrice.length,
        cartItemsCount: cartItems.length,
        itemsToSendCount: itemsToSend.length,
        itemsToSend,
      });

      if (itemsToSend.length === 0) {
        window?.alert?.("Your cart is empty. Please add items before placing an order.");
        return;
      }

      // Prepare checkout body with advance payment details if applicable
      const checkoutBody = {
        guestUserId: gId || undefined,
        shippingAddress: shippingAddressSnapshot,
        items: itemsToSend,
        coupon: appliedCoupon && appliedCouponCode ? { code: appliedCouponCode, discount } : null,
        subtotal,
        discount,
        total,
        paymentMethod: "COD",
      };

      // Add advance payment details if paid
      if (codSettings.codAdvanceEnabled && codAdvancePaid) {
        checkoutBody.razorpay_order_id = codAdvanceOrderId;
        checkoutBody.razorpay_payment_id = codAdvancePaymentId;
        checkoutBody.razorpay_signature = codAdvanceSignature;
      }

      // Create order directly via checkout API
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutBody),
      });

      const checkoutData = await checkoutRes.json().catch(() => ({}));
      if (!checkoutRes.ok) {
        window?.alert?.(checkoutData?.message || "Could not place order. Please try again.");
        return;
      }

      // Order successfully created in database - trigger premium success animation
      // This is payment-agnostic and order-status driven only
      setOrderId(checkoutData?.orderId || null);
      setSuccessPaymentMethod("COD");
      setOrderSuccess(true);
      
      clearCart();
      setStep(1);
      setPaymentMethod("not_selected");
      // Reset coupon state
      setAppliedCoupon(false);
      setCouponCode("");
      setCouponDiscount(0);
      setOrderDiscount(0);
      setOrderTotal(orderSubtotal || calculatedSubtotal);
      setAppliedCouponCode("");
      setCouponError("");
      setShowCouponSuccess(false);
      // Reset COD advance state
      setCodAdvancePaid(false);
      setCodAdvancePaymentId(null);
      setCodAdvanceOrderId(null);
      setCodAdvanceSignature(null);
    } catch (err) {
      setDeliveryCreationError(
        err && err.message
          ? err.message
          : "Could not place order. Please try again."
      );
      window?.alert?.("Could not create delivery/order. Please try again.");
    }
  }

  async function handlePayment() {
    setDeliveryCreationError(null);

    // OTP verification is ONLY required when user explicitly selects "Create an account"
    // Guest checkout should proceed without OTP
    if (form.createAccount) {
      // Check OTP verification before placing order
      if (isOTPVerificationRequired && !isOTPVerified && verificationStep !== "otp_sent") {
        const otpSent = await triggerOTPVerification();
        if (!otpSent) {
          setOtpError("Failed to send verification code. Please try again.");
          return;
        }
        window?.alert?.("Please verify the OTP before placing your order.");
        return;
      }

      if (verificationStep === "otp_sent" && !isOTPVerified) {
        window?.alert?.("Please verify the OTP before placing your order.");
        return;
      }
    }
    // If createAccount is false, skip OTP entirely and proceed with payment

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
          const shippingAddressSnapshot = {
            fullName: [form.firstName, form.lastName].filter(Boolean).join(" "),
            phone: form.phone,
            addressLine1: form.address,
            addressLine2: form.apt,
            city: form.city,
            state: form.state,
            pincode: form.pin,
            country: form.country,
          };

          // Ensure guest user exists if not logged in
          const gId = await upsertGuestUser(shippingAddressSnapshot);

          // Ensure items are available - use cartItems directly if itemsWithFinalPrice is empty
          let itemsToSend = [];
          
          if (itemsWithFinalPrice.length > 0) {
            itemsToSend = itemsWithFinalPrice;
          } else if (cartItems.length > 0) {
            // Map cartItems to ensure they have all required fields
            itemsToSend = cartItems.map(item => ({
              id: item.id || item._id || item.productId || "",
              name: item.name || "",
              image: item.image || "",
              size: item.size || "",
              color: item.color || "",
              price: item.price || 0,
              finalPrice: item.finalPrice ?? item.price ?? 0,
              quantity: item.quantity || 1,
            }));
          }

          console.log("handlePayment: Items to send", {
            itemsWithFinalPriceCount: itemsWithFinalPrice.length,
            cartItemsCount: cartItems.length,
            itemsToSendCount: itemsToSend.length,
            itemsToSend,
          });

          if (itemsToSend.length === 0) {
            window?.alert?.("Your cart is empty. Please add items before placing an order.");
            return;
          }

          // Create order directly via checkout API with payment verification
          const checkoutRes = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              guestUserId: gId || undefined,
              shippingAddress: shippingAddressSnapshot,
              items: itemsToSend,
              coupon: appliedCoupon && appliedCouponCode ? { code: appliedCouponCode, discount } : null,
              subtotal,
              discount,
              total,
              paymentMethod: "ONLINE",
              razorpay_order_id: data.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const checkoutData = await checkoutRes.json().catch(() => ({}));
          if (!checkoutRes.ok) {
            window?.alert?.(checkoutData?.message || "Payment verified but order creation failed.");
            return;
          }

          // Order successfully created in database - trigger premium success animation
          // This is payment-agnostic and order-status driven only
          // Animation triggers after order is saved, not tied to payment success
          setOrderId(checkoutData?.orderId || null);
          setSuccessPaymentMethod("ONLINE");
          setOrderSuccess(true);
          
          clearCart();
          setStep(1);
          setPaymentMethod("not_selected");
          // Reset coupon state
          setAppliedCoupon(false);
          setCouponCode("");
          setCouponDiscount(0);
          setCouponError("");
          setShowCouponSuccess(false);
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
    return `
      w-full rounded-2xl px-4 py-2 sm:py-2.5
      bg-black/85 border border-white/15
      text-white/93 font-semibold
      placeholder:text-white/30 placeholder:font-medium
      transition-all duration-600 ease-out
      focus:bg-black/75 focus:border-white/40 focus:ring-2 focus:ring-white/20
      hover:border-white/40
      hover:shadow-[0_0_0_2px_rgba(255,255,255,0.06)]

      outline-none ring-0
      sm:text-[1.07rem]
      ${formErrors[errorKey] ? "border-rose-400/90" : ""}
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
        <RootCheckoutPageGlobalStyles />
      </>
    );
  }

  // Handle back navigation based on current step
  const handleBack = () => {
    if (step === 3) {
      // Payment → Shipping
      setStep(2);
    } else if (step === 2) {
      // Shipping → Information
      setStep(1);
    } else if (step === 1) {
      // Information → Cart
      router.push("/cart");
    }
  };

  // Get current step name for MobileCheckoutHeader
  const getCurrentStepName = () => {
    if (step === 1) return 'information';
    if (step === 2) return 'shipping';
    if (step === 3) return 'payment';
    return 'information';
  };

  // ---- Main Page ----
  return (
    <>
      {/* Mobile: Fixed Back button at top-left */}
      <MobileCheckoutHeader currentStep={getCurrentStepName()} onBack={handleBack} />
      <div
        className={`${mainPageClass} animate-reveal`}
        style={{
          background: "#000",
          letterSpacing: '0.01em',
        }}
      >
        <div className={mainLayoutClass}>
          {/* --- LEFT FORM --- */}
          <section
  className={`${leftFormSectionClass} animate-reveal group overflow-hidden relative premium-summary-hover`}
>


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
            <form
              className="premium-fade-in premium-slide-in w-full max-w-lg transition-all duration-600 ease-out"
              autoComplete="off"
              onSubmit={handleContinue}
              style={{ minHeight: 420 }}
            >
              {/* --- STEP 1 --- */}
              {step === 1 && (
                <div className="premium-step-animate animate-reveal pt-16 md:pt-0">
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
                    {/* Account Creation - Contact Method Selection */}
                    {form.createAccount && (
                      <div
                        className="w-full mt-6 flex flex-col sm:flex-row gap-4 border-t border-white/12 pt-7 transition-all duration-500 ease-out"
                        style={{ minHeight: 120 }}
                      >
                        {/* WhatsApp Icon - Visual Only */}
                        <div 
                          className={`
                            flex-1 basis-0 min-w-0 px-5 py-6 rounded-2xl 
                            bg-gradient-to-b from-white/10 to-white/0 
                            border transition-all duration-500 ease-out
                            shadow-[0_20px_80px_rgba(255,255,255,0.13)]
                            cursor-pointer group
                            hover:-translate-y-1 hover:shadow-[0_28px_110px_rgba(255,255,255,0.25)] hover:border-white/40
                            ${selectedContactMethod === "whatsapp" 
                              ? "border-white/85 shadow-[0_28px_110px_rgba(255,255,255,0.30)] scale-[1.03] bg-gradient-to-b from-white/15 to-white/5 hover:scale-[1.05] hover:shadow-[0_32px_120px_rgba(255,255,255,0.35)]" 
                              : "border-white/15 opacity-70 hover:opacity-100"
                            }
                          `}
                          onClick={() => setSelectedContactMethod(selectedContactMethod === "whatsapp" ? null : "whatsapp")}
                          role="button"
                          tabIndex={0}
                          aria-pressed={selectedContactMethod === "whatsapp"}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedContactMethod(selectedContactMethod === "whatsapp" ? null : "whatsapp");
                            }
                          }}
                          style={{
                            fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                            outline: selectedContactMethod === "whatsapp" ? "2px solid rgba(255,255,255,0.5)" : undefined,
                          }}
                        >
                          <div className="flex items-center mb-2 w-full">
                            <span className={`inline-flex items-center justify-center w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-black/70 border text-[1.49rem] text-white/95 shadow-sm mr-3 transition-all duration-500 ${
                              selectedContactMethod === "whatsapp" 
                                ? "border-white/40 shadow-[0_0_12px_rgba(255,255,255,0.25)]" 
                                : "border-white/20"
                            }`}>
                              <svg width="27" height="27" viewBox="0 0 40 40" fill="none">
                                <rect width="40" height="40" rx="12" fill="url(#wa__g)" />
                                <path d="M19.98 7C12.3 7 5.98 13.32 5.98 21c0 2.96.97 5.8 2.81 8.15L5 36.99l8.13-3.66c2.31 1.32 4.92 2.01 7.85 2.01 7.68 0 13.99-6.32 13.99-14S27.66 7 19.98 7Zm0 24.91c-2.61 0-5.15-.7-7.36-2.03l-.53-.32-4.84 2.18 1.03-4.78-.34-.42A12.34 12.34 0 0 1 7.31 21c0-6.98 5.68-12.66 12.67-12.66s12.66 5.68 12.66 12.66c0 6.99-5.68 12.67-12.66 12.67Z" fill="#fff" />
                                <path d="M29.14 25.42c-.4-.2-2.34-1.15-2.7-1.29-.36-.13-.62-.19-.89.2-.26.39-1.02 1.29-1.25 1.55-.23.26-.46.3-.86.1-.4-.2-1.67-.62-3.19-1.95-1.18-1.06-1.99-2.37-2.22-2.77-.23-.4-.02-.6.17-.8.18-.18.4-.47.59-.7.2-.23.26-.4.4-.66.13-.26.07-.5-.02-.7-.09-.2-.79-1.91-1.08-2.65-.29-.7-.58-.61-.8-.62-.21-.01-.46-.01-.7-.01-.24 0-.62.09-.92.4-.31.31-1.2 1.17-1.2 2.86 0 1.68 1.23 3.32 1.41 3.57.18.26 2.43 3.86 6.4 5.22A7.16 7.16 0 0 0 24 28c1.17-.05 1.88-.75 2.18-1.18.31-.44.31-.82.22-.9a4.6 4.6 0 0 0-.91-.5Z" fill="#3ad07c" />
                                <defs>
                                  <linearGradient id="wa__g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#222d22"/><stop offset="1" stopColor="#142d18"/>
                                  </linearGradient>
                                </defs>
                              </svg>
                            </span>
                            <span className={`font-bold text-[1.13rem] tracking-wide transition-all duration-500 ${
                              selectedContactMethod === "whatsapp" 
                                ? "text-white" 
                                : "text-white/93"
                            }`}>
                              WhatsApp
                            </span>
                          </div>
                        </div>
                        {/* Email Icon - Visual Only */}
                        <div 
                          className={`
                            flex-1 basis-0 min-w-0 px-5 py-6 rounded-2xl 
                            bg-gradient-to-b from-white/10 to-white/0 
                            border transition-all duration-500 ease-out
                            shadow-[0_20px_80px_rgba(255,255,255,0.13)]
                            cursor-pointer group
                            hover:-translate-y-1 hover:shadow-[0_28px_110px_rgba(255,255,255,0.25)] hover:border-white/40
                            ${selectedContactMethod === "email" 
                              ? "border-white/85 shadow-[0_28px_110px_rgba(255,255,255,0.30)] scale-[1.03] bg-gradient-to-b from-white/15 to-white/5 hover:scale-[1.05] hover:shadow-[0_32px_120px_rgba(255,255,255,0.35)]" 
                              : "border-white/15 opacity-70 hover:opacity-100"
                            }
                          `}
                          onClick={() => setSelectedContactMethod(selectedContactMethod === "email" ? null : "email")}
                          role="button"
                          tabIndex={0}
                          aria-pressed={selectedContactMethod === "email"}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedContactMethod(selectedContactMethod === "email" ? null : "email");
                            }
                          }}
                          style={{
                            fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                            outline: selectedContactMethod === "email" ? "2px solid rgba(255,255,255,0.5)" : undefined,
                          }}
                        >
                          <div className="flex items-center mb-2 w-full">
                            <span className={`inline-flex items-center justify-center w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-black/70 border text-[1.49rem] text-white/95 shadow-sm mr-3 transition-all duration-500 ${
                              selectedContactMethod === "email" 
                                ? "border-white/40 shadow-[0_0_12px_rgba(255,255,255,0.25)]" 
                                : "border-white/20"
                            }`}>
                              <svg width="28" height="28" fill="none" viewBox="0 0 40 40">
                                <rect width="40" height="40" rx="12" fill="url(#email__g)"/>
                                <rect x="9" y="13" width="22" height="14" rx="2.2" fill="#fff" fillOpacity=".99" stroke="#dceedb" strokeWidth="2"/>
                                <path d="M11.9 15.34l8.07 6.97c.38.33.9.33 1.28 0l8-6.92" stroke="#e3fad1" strokeWidth="1.8"/>
                                <defs>
                                  <linearGradient id="email__g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#2b2c36"/><stop offset="1" stopColor="#23242b"/>
                                  </linearGradient>
                                </defs>
                              </svg>
                            </span>
                            <span className={`font-bold text-[1.13rem] tracking-wide transition-all duration-500 ${
                              selectedContactMethod === "email" 
                                ? "text-white" 
                                : "text-white/93"
                            }`}>
                              Email
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* OTP Verification Section - Dynamic */}
                    {/* Only show OTP UI when user has selected "Create an account" */}
                    {form.createAccount && verificationStep === "otp_sent" && (
                      <div className="w-full mt-6 border-t border-white/12 pt-6 transition-all duration-500 ease-out">
                        {/* Inline success message */}
                        {otpSentMessage && (
                          <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30">
                            <p className="text-sm text-green-400/90 font-semibold">
                              {otpSentMessage}
                            </p>
                          </div>
                        )}

                        {/* OTP Input Fields */}
                        <div className="space-y-4">
                          {/* WhatsApp OTP */}
                          {(selectedContactMethod === "whatsapp" || (!selectedContactMethod && form.phone)) && !whatsappVerified ? (
                            <div>
                              <label className="block text-sm font-semibold text-white/90 mb-2">
                                Enter WhatsApp Verification Code
                              </label>
                              <div className="flex gap-3">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={6}
                                  placeholder="000000"
                                  value={verificationOtp}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                                    setVerificationOtp(val);
                                    setOtpError("");
                                  }}
                                  className={`
                                    flex-1 rounded-2xl px-4 py-3 bg-black/85 border border-white/18 text-white/93 font-semibold text-center text-2xl tracking-widest
                                    placeholder:text-white/38 outline-none ring-0
                                    focus:ring-2 focus:ring-white/20 focus:border-white/46
                                    hover:border-white/25
                                    transition-all duration-600 ease-out
                                    ${otpLoading ? "opacity-60 cursor-not-allowed" : ""}
                                    ${otpError ? "border-rose-400/90" : ""}
                                  `}
                                  style={{
                                    fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                                  }}
                                  disabled={otpLoading || whatsappVerified}
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const success = await verifyOTP(
                                      "whatsapp",
                                      form.phone.replace(/\D/g, "").slice(0, 10),
                                      verificationOtp
                                    );
                                    if (success) {
                                      setVerificationOtp("");
                                    }
                                  }}
                                  disabled={otpLoading || verificationOtp.length !== 6 || whatsappVerified}
                                  className={`
                                    px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-white/20 to-white/10
                                    border border-white/30 hover:border-white/50
                                    transition-all duration-300 ease-out
                                    disabled:opacity-40 disabled:cursor-not-allowed
                                  `}
                                >
                                  {whatsappVerified ? "✓ Verified" : "Verify"}
                                </button>
                              </div>
                            </div>
                          ) : null}

                          {/* Email OTP */}
                          {(selectedContactMethod === "email" || (!selectedContactMethod && form.email)) && !emailVerified ? (
                            <div>
                              <label className="block text-sm font-semibold text-white/90 mb-2">
                                Enter Email Verification Code
                              </label>
                              <div className="flex gap-3">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={6}
                                  placeholder="000000"
                                  value={verificationOtp}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                                    setVerificationOtp(val);
                                    setOtpError("");
                                  }}
                                  className={`
                                    flex-1 rounded-2xl px-4 py-3 bg-black/85 border border-white/18 text-white/93 font-semibold text-center text-2xl tracking-widest
                                    placeholder:text-white/38 outline-none ring-0
                                    focus:ring-2 focus:ring-white/20 focus:border-white/46
                                    hover:border-white/25
                                    transition-all duration-600 ease-out
                                    ${otpLoading ? "opacity-60 cursor-not-allowed" : ""}
                                    ${otpError ? "border-rose-400/90" : ""}
                                  `}
                                  style={{
                                    fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                                  }}
                                  disabled={otpLoading || emailVerified}
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const success = await verifyOTP(
                                      "email",
                                      form.email.trim().toLowerCase(),
                                      verificationOtp
                                    );
                                    if (success) {
                                      setVerificationOtp("");
                                    }
                                  }}
                                  disabled={otpLoading || verificationOtp.length !== 6 || emailVerified}
                                  className={`
                                    px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-white/20 to-white/10
                                    border border-white/30 hover:border-white/50
                                    transition-all duration-300 ease-out
                                    disabled:opacity-40 disabled:cursor-not-allowed
                                  `}
                                >
                                  {emailVerified ? "✓ Verified" : "Verify"}
                                </button>
                              </div>
                            </div>
                          ) : null}

                          {/* Error Message */}
                          {otpError && (
                            <div className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                              <p className="text-sm text-rose-400/90 font-semibold">{otpError}</p>
                            </div>
                          )}

                          {/* Resend OTP Button */}
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={async () => {
                                if (resendCooldown > 0) return;
                                await triggerOTPVerification();
                              }}
                              disabled={resendCooldown > 0 || otpLoading}
                              className={`
                                text-sm font-semibold text-white/70 hover:text-white/90
                                transition-all duration-300 ease-out
                                disabled:opacity-40 disabled:cursor-not-allowed
                              `}
                            >
                              {resendCooldown > 0 
                                ? `Resend code in ${resendCooldown}s` 
                                : "Resend verification code"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-8 md:mt-8">
                    {/* Desktop: Back button */}
                    <button
                      type="button"
                      onClick={() => router.push("/cart")}
                      className="hidden md:flex group relative px-6 py-3 rounded-full bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-white/15 text-white/90 font-semibold tracking-wide overflow-hidden transition-all duration-300 ease-in-out cursor-pointer hover:border-white/30 hover:text-white active:scale-[0.97]"
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
                    <button
                      type="submit"
                      className={`
                        flex-1 relative py-3.5 px-8 rounded-full font-extrabold text-black bg-gradient-to-r from-white to-zinc-200
                        shadow-[0_10px_34px_rgba(255,255,255,0.17)]
                        overflow-hidden group transition-all duration-300 ease-in-out cursor-pointer
                        tracking-widest text-[1.15rem] select-none
                        disabled:opacity-38 disabled:cursor-not-allowed
                        ${!canContinueToShipping ? "opacity-38 cursor-not-allowed pointer-events-none" : ""}
                      `}
                      style={{
                        fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                      }}
                      disabled={!canContinueToShipping}
                    >
                      <span className="relative z-10 flex items-center transition-all duration-300 ease-in-out group-hover:text-white">
                        Continue to Shipping
                        <span className="ml-2 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ease-in-out">
                          <svg width="18" height="18" fill="none" className="inline" viewBox="0 0 24 24">
                            <path d="M12 5l7 7-7 7M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </span>
                      {/* Premium dark glass hover overlay */}
                      <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                        {/* Dark gradient background (charcoal → black) */}
                        <span className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] rounded-full"></span>
                        {/* Inner highlight (top) */}
                        <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-full"></span>
                        {/* Outer glow */}
                        <span className="absolute inset-0 rounded-full" style={{
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), 0 0 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.4)'
                        }}></span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
              {/* --- STEP 2 (Shipping) --- */}
              {step === 2 && (
                <div className="premium-step-animate animate-reveal pt-16 md:pt-0">
                  <h2 className="mb-5 text-xl font-bold uppercase tracking-wide text-white/93">
                    Shipping
                  </h2>
                  {!authUser && <AddressSummary form={form} />}

                  {/* Logged-in user: address selection + add new */}
                  {authUser && (
                    <div className="mb-7 w-full bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-2xl px-6 py-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-bold tracking-wide text-white/90 uppercase text-sm">
                          Select Shipping Address
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddAddress((v) => !v)}
                          className="group relative px-4 py-2 rounded-full bg-white text-black font-extrabold text-xs tracking-widest overflow-hidden transition-all duration-300 ease-in-out cursor-pointer"
                        >
                          <span className="relative z-10 transition-colors duration-300 ease-in-out group-hover:text-white">
                            {showAddAddress ? "Cancel" : "Add New Address"}
                          </span>
                          {/* Premium dark glass hover overlay */}
                          <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                            {/* Dark gradient background (charcoal → black) */}
                            <span className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] rounded-full"></span>
                            {/* Inner highlight (top) */}
                            <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-full"></span>
                            {/* Outer glow */}
                            <span className="absolute inset-0 rounded-full" style={{
                              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), 0 0 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.4)'
                            }}></span>
                          </span>
                        </button>
                      </div>

                      {savedAddresses.length === 0 ? (
                        <div className="text-white/70 text-sm">
                          No saved addresses. Please add one.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {savedAddresses.map((a) => (
                            <label
                              key={a._id}
                              className={`block cursor-pointer rounded-xl border px-4 py-3 transition ${
                                selectedAddressId === a._id
                                  ? "border-white/60 bg-white/10"
                                  : "border-white/10 bg-black/40 hover:border-white/25"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="radio"
                                  name="selectedAddress"
                                  checked={selectedAddressId === a._id}
                                  onChange={() => setSelectedAddressId(a._id)}
                                  className="mt-1"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-white/95">
                                    {a.fullName}
                                  </div>
                                  <div className="text-white/70 text-xs font-semibold tracking-widest">
                                    +91 {a.phone}
                                  </div>
                                  <div className="text-white/70 text-xs mt-1">
                                    {[a.addressLine1, a.addressLine2, a.city, a.state, a.pincode, a.country]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </div>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}

                      {showAddAddress && (
                        <div className="mt-5 border-t border-white/10 pt-5 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Full Name*"
                              className={fieldClass("fullName")}
                              value={newAddress.fullName}
                              onChange={(e) => setNewAddress((s) => ({ ...s, fullName: e.target.value }))}
                            />
                            <input
                              type="text"
                              placeholder="Phone*"
                              className={fieldClass("phone")}
                              value={newAddress.phone}
                              onChange={(e) =>
                                setNewAddress((s) => ({
                                  ...s,
                                  phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                                }))
                              }
                            />
                            <input
                              type="text"
                              placeholder="Address Line 1*"
                              className={fieldClass("address")}
                              value={newAddress.addressLine1}
                              onChange={(e) => setNewAddress((s) => ({ ...s, addressLine1: e.target.value }))}
                            />
                            <input
                              type="text"
                              placeholder="Address Line 2"
                              className={fieldClass("apt")}
                              value={newAddress.addressLine2}
                              onChange={(e) => setNewAddress((s) => ({ ...s, addressLine2: e.target.value }))}
                            />
                            <input
                              type="text"
                              placeholder="City*"
                              className={fieldClass("city")}
                              value={newAddress.city}
                              onChange={(e) => setNewAddress((s) => ({ ...s, city: e.target.value }))}
                            />
                            <input
                              type="text"
                              placeholder="State*"
                              className={fieldClass("state")}
                              value={newAddress.state}
                              onChange={(e) => setNewAddress((s) => ({ ...s, state: e.target.value }))}
                            />
                            <input
                              type="text"
                              placeholder="Pincode*"
                              className={fieldClass("pin")}
                              value={newAddress.pincode}
                              onChange={(e) =>
                                setNewAddress((s) => ({
                                  ...s,
                                  pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                                }))
                              }
                            />
                            <input
                              type="text"
                              placeholder="Country"
                              className={fieldClass("country")}
                              value={newAddress.country}
                              onChange={(e) => setNewAddress((s) => ({ ...s, country: e.target.value }))}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={saveNewAddressToUser}
                            className="group relative px-5 py-2 rounded-full bg-white text-black font-extrabold tracking-widest text-xs overflow-hidden transition-all duration-300 ease-in-out cursor-pointer"
                          >
                            <span className="relative z-10 transition-colors duration-300 ease-in-out group-hover:text-white">
                              Save Address
                            </span>
                            {/* Premium dark glass hover overlay */}
                            <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                              {/* Dark gradient background (charcoal → black) */}
                              <span className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] rounded-full"></span>
                              {/* Inner highlight (top) */}
                              <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-full"></span>
                              {/* Outer glow */}
                              <span className="absolute inset-0 rounded-full" style={{
                                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), 0 0 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.4)'
                              }}></span>
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
                  <div className="flex items-center gap-4 mt-8 md:mt-8">
                    {/* Desktop: Back button */}
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="hidden md:flex group relative px-6 py-3 rounded-full bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-white/15 text-white/90 font-semibold tracking-wide overflow-hidden transition-all duration-300 ease-in-out cursor-pointer hover:border-white/30 hover:text-white active:scale-[0.97]"
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
                    <button
                      type="button"
                      className={`
                        flex-1 relative py-3.5 px-8 rounded-full font-black text-black bg-gradient-to-r from-white to-zinc-200
                        shadow-[0_10px_32px_rgba(255,255,255,0.13)]
                        overflow-hidden group transition-all duration-300 ease-in-out cursor-pointer
                        tracking-widest text-[1.15rem] select-none
                        disabled:opacity-34 disabled:cursor-not-allowed
                        ${itemsWithFinalPrice.length === 0 ? "opacity-34 cursor-not-allowed pointer-events-none" : ""}
                      `}
                      onClick={async () => {
                        if (itemsWithFinalPrice.length === 0) return;
                        // Build shipping snapshot: logged-in uses selected saved address; guest uses form.
                        let snapshot = null;
                        if (authUser) {
                          const sel = savedAddresses.find((a) => a._id === selectedAddressId) || savedAddresses[0];
                          if (sel) {
                            snapshot = {
                              fullName: sel.fullName,
                              phone: sel.phone,
                              addressLine1: sel.addressLine1,
                              addressLine2: sel.addressLine2 || "",
                              city: sel.city,
                              state: sel.state,
                              pincode: sel.pincode,
                              country: sel.country || "India",
                            };
                          }
                        } else {
                          snapshot = {
                            fullName: [form.firstName, form.lastName].filter(Boolean).join(" "),
                            phone: form.phone,
                            addressLine1: form.address,
                            addressLine2: form.apt,
                            city: form.city,
                            state: form.state,
                            pincode: form.pin,
                            country: form.country,
                          };
                        }
                        if (snapshot) {
                          await upsertGuestUser(snapshot);
                        }
                        setStep(3);
                      }}
                      style={{
                        fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                      }}
                      disabled={
                        itemsWithFinalPrice.length === 0
                      }
                    >
                      <span className="relative z-10 flex items-center transition-all duration-300 ease-in-out group-hover:text-white">
                        Continue to Payment
                        <span className="ml-2 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ease-in-out">
                          <svg width="18" height="18" fill="none" className="inline" viewBox="0 0 24 24">
                            <path d="M12 5l7 7-7 7M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </span>
                      {/* Premium dark glass hover overlay */}
                      <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                        {/* Dark gradient background (charcoal → black) */}
                        <span className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] rounded-full"></span>
                        {/* Inner highlight (top) */}
                        <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-full"></span>
                        {/* Outer glow */}
                        <span className="absolute inset-0 rounded-full" style={{
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), 0 0 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.4)'
                        }}></span>
                      </span>
                    </button>
                  </div>
                  {deliveryCreationError && (
                    <div className="mt-5 text-rose-400/90 font-bold bg-rose-900/10 rounded-lg py-2 px-4 border border-rose-400/45">{deliveryCreationError}</div>
                  )}
                </div>
              )}
              {/* --- STEP 3 (Payment) --- */}
              {step === 3 && (
                <div className="premium-step-animate animate-reveal pt-16 md:pt-0">
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
                  {/* Desktop: Back button */}
                  <div className="hidden md:block mb-6">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="group relative px-6 py-3 rounded-full bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-white/15 text-white/90 font-semibold tracking-wide overflow-hidden transition-all duration-300 ease-in-out cursor-pointer hover:border-white/30 hover:text-white active:scale-[0.97]"
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
                  </div>
                  
                  {/* COD Advance Payment Notice */}
                  {paymentMethod === "cod" && codSettings.codAdvanceEnabled && (
                    <div className="mb-6 p-5 rounded-2xl bg-gradient-to-b from-amber-900/20 to-amber-800/10 border border-amber-500/30">
                      {!codAdvancePaid ? (
                        <div>
                          <p className="text-white/90 font-semibold mb-2">
                            To confirm your Cash On Delivery order, please pay ₹{codSettings.codAdvanceAmount} as COD advance.
                          </p>
                          <button
                            type="button"
                            onClick={handleCODAdvancePayment}
                            disabled={codAdvanceLoading || itemsWithFinalPrice.length === 0}
                            className={`
                              relative py-3 px-6 rounded-full font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700
                              shadow-[0_8px_24px_rgba(245,158,11,0.3)]
                              overflow-hidden group transition-all duration-300 ease-in-out
                              tracking-wide select-none cursor-pointer
                              ${codAdvanceLoading || itemsWithFinalPrice.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:from-amber-700 hover:to-amber-800"}
                            `}
                            style={{
                              fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                            }}
                          >
                            {codAdvanceLoading ? "Processing..." : `Pay ₹${codSettings.codAdvanceAmount} COD Advance`}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-green-400 font-semibold">
                            COD advance of ₹{codSettings.codAdvanceAmount} completed. You can now place your order.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-7 sm:gap-6 md:gap-6">
                    <button
                      ref={paymentButtonRef}
                      type="button"
                      className={`
                        relative py-4 px-8 mt-2 rounded-full font-extrabold text-black bg-gradient-to-r from-white to-zinc-200
                        shadow-[0_10px_32px_rgba(255,255,255,0.13)]
                        overflow-hidden group transition-all duration-300 ease-in-out cursor-pointer
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
                      <span className="relative z-10 flex items-center transition-all duration-300 ease-in-out group-hover:text-white">
                        <span className="text-black group-hover:text-white transition-colors duration-300 ease-in-out">Pay&nbsp;</span>
                        <span className="font-extrabold underline underline-offset-4 text-black group-hover:text-white text-[1.33em] select-none transition-colors duration-300 ease-in-out">
                          ₹{total.toLocaleString()}
                        </span>
                        <span className="ml-2 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ease-in-out relative z-10">
                          <svg width="18" height="18" fill="none" className="inline" viewBox="0 0 24 24">
                            <path d="M12 5l7 7-7 7M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                        {razorpayLoading &&
                          <span className="ml-3 text-xs font-normal text-white/60 animate-premiumPulse align-super select-none font-semibold relative z-10">(processing…)</span>
                        }
                      </span>
                      {/* Premium dark glass hover overlay */}
                      <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                        {/* Dark gradient background (charcoal → black) */}
                        <span className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] rounded-full"></span>
                        {/* Inner highlight (top) */}
                        <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-full"></span>
                        {/* Outer glow */}
                        <span className="absolute inset-0 rounded-full" style={{
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), 0 0 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.4)'
                        }}></span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`
                        relative py-4 px-8 mt-2 rounded-full font-extrabold text-black bg-gradient-to-r from-white to-zinc-200
                        shadow-[0_12px_32px_rgba(255,255,255,0.13)]
                        overflow-hidden group transition-all duration-300 ease-in-out
                        tracking-wider text-[1.17rem] select-none cursor-pointer
                        ${paymentMethod !== "cod" || itemsWithFinalPrice.length === 0 || (codSettings.codAdvanceEnabled && !codAdvancePaid) ? "opacity-36 pointer-events-none cursor-not-allowed" : ""}
                      `}
                      style={{
                        fontFamily: "Inter,Poppins,Neue Haas,sans-serif",
                        display: paymentMethod === "cod" ? undefined : "none",
                      }}
                      onClick={handleCOD}
                      disabled={paymentMethod !== "cod" || itemsWithFinalPrice.length === 0 || (codSettings.codAdvanceEnabled && !codAdvancePaid)}
                    >
                      <span className="relative z-10 flex items-center transition-all duration-300 ease-in-out group-hover:text-white">
                        Place Order&nbsp;(Cash on Delivery)
                        <span className="ml-2 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ease-in-out relative z-10">
                          <svg width="18" height="18" fill="none" className="inline" viewBox="0 0 24 24">
                            <path d="M12 5l7 7-7 7M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </span>
                      {/* Premium dark glass hover overlay */}
                      <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                        {/* Dark gradient background (charcoal → black) */}
                        <span className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] rounded-full"></span>
                        {/* Inner highlight (top) */}
                        <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-full"></span>
                        {/* Outer glow */}
                        <span className="absolute inset-0 rounded-full" style={{
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), 0 0 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.4)'
                        }}></span>
                      </span>
                    </button>
                  </div>
                  {deliveryCreationError && (
                    <div className="mt-5 text-rose-400/90 font-bold bg-rose-900/10 rounded-lg py-2 px-4 border border-rose-400/45">{deliveryCreationError}</div>
                  )}
                </div>
              )}
            </form>
          </section>
          {/* --- RIGHT ORDER SUMMARY --- */}
          <aside className="w-full md:w-[38%] max-w-[450px] min-w-[330px] sticky top-8 self-start">
            <div className={`${asideCardClass} animate-reveal group premium-summary-hover`}>
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
              {/* First Order Coupon Banner */}
              {(() => {
                const isLoggedIn = !!authUser;
                const isFirstOrderEligible = isLoggedIn && 
                  (authUser.orderCount ?? 0) === 0 && 
                  (authUser.firstOrderCouponUsed ?? false) === false;
                
                // Show banner for logged-out users (even if no coupon set)
                if (!isLoggedIn) {
                  if (firstOrderCoupon) {
                    const discountText = firstOrderCoupon.discountType === "percentage"
                      ? `${firstOrderCoupon.discountValue}% off`
                      : `₹${firstOrderCoupon.discountValue} off`;
                    return (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 via-yellow-500/8 to-yellow-500/10 border border-yellow-400/30">
                        <p className="text-yellow-300/90 text-sm font-semibold text-center">
                          Login to get {discountText} on your first order
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 via-yellow-500/8 to-yellow-500/10 border border-yellow-400/30">
                        <p className="text-yellow-300/90 text-sm font-semibold text-center">
                          Login to get special offers on your first order
                        </p>
                      </div>
                    );
                  }
                }
                
                // Show banner for logged-in eligible users
                if (isFirstOrderEligible && firstOrderCoupon) {
                  const discountText = firstOrderCoupon.discountType === "percentage"
                    ? `${firstOrderCoupon.discountValue}% off`
                    : `₹${firstOrderCoupon.discountValue} off`;
                  return (
                    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 via-green-500/8 to-green-500/10 border border-green-400/30">
                      <p className="text-green-300/90 text-sm font-semibold text-center">
                        🎉 First order offer: Use {firstOrderCoupon.code} & get {discountText}
                      </p>
                    </div>
                  );
                }
                
                return null;
              })()}
              <CouponDropdown
                activeCoupons={activeCoupons}
                appliedCoupon={appliedCoupon}
                appliedCouponCode={appliedCouponCode}
                couponDiscount={couponDiscount}
                couponError={couponError}
                onCouponSelect={handleCouponSelect}
                onRemoveCoupon={handleRemoveCoupon}
                loading={couponLoading}
              />
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
                  <span
                    className={`text-white/90 tracking-widest font-extrabold
                      text-sm sm:text-base
                      leading-none select-none`}
                  >
                    Total
                  </span>
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
        .premium-order-summary-card {
          /* Add hover lift, border, and subtle shadow, matching other premium cards */
          position: relative;
          will-change: transform, box-shadow, border-color;
          transition: box-shadow .44s cubic-bezier(.4,0,.2,1), transform .43s cubic-bezier(.4,0,.2,1), border-color .44s cubic-bezier(.4,0,.2,1);
        }
        .premium-order-summary-card.group:hover,
        .premium-order-summary-card:focus-within,
        .premium-summary-hover:hover {
          border-color: #fff !important;
          box-shadow: 0 18px 72px 0 rgba(255,255,255,0.18),0 0 0 2.4px rgba(255,255,255,0.11);
          transform: translateY(-4px) scale(1.018);
        }
        .premium-order-summary-card:after,
        .premium-summary-hover:after {
          content: '';
          pointer-events: none;
          position: absolute; left: 0; top: 0; width: 100%; height: 100%;
          border-radius: 1.35rem;
          z-index: 2;
          box-shadow: 0 0 0 2.5px rgba(255,255,255,0.13);
          opacity: 0;
          transition: opacity .62s cubic-bezier(.4,0,.2,1);
        }
        .premium-order-summary-card.group:hover:after,
        .premium-order-summary-card:focus-within:after,
        .premium-summary-hover:hover:after {
          opacity: 1;
        }
        @media (max-width: 1024px) {
          .premium-order-summary-card { max-width: 99vw; }
          .premium-summary-hover { max-width: 99vw; }
        }
        /* Animates password fields after OTP verification */
        @keyframes premiumSlideFadeIn {
          from { opacity: 0; transform: translateY(21px) scale(.99); }
          32% { opacity: 1; }
          to { opacity: 1; transform: none; }
        }
        .animate-premiumSlideFadeIn {
          animation: premiumSlideFadeIn .84s cubic-bezier(.4,0,.2,1);
        }
        /* Compact send otp/verify buttons */
        .premium-send-otp-btn, .premium-verify-btn {
          min-width: 84px;
        }
      `}</style>
      {/* Premium Order Success Modal */}
      <OrderSuccessModal
        isOpen={orderSuccess}
        onClose={() => {
          setOrderSuccess(false);
          setOrderId(null);
        }}
        paymentMethod={successPaymentMethod}
        orderId={orderId}
        clearCart={clearCart}
      />
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
        .animate-reveal {
          animation: revealSection .99s cubic-bezier(.41,0,.22,1);
        }
        @keyframes revealSection {
          from { opacity: 0; transform: scale(0.98) translateY(38px);}
          to { opacity: 1; transform: none;}
        }
        @keyframes premiumShine {
          0% { left: -72%; opacity: 0.055;}
          54% { left: 82%; opacity: 0.21;}
          100% { left: 130%; opacity: 0;}
        }
        .animate-premiumShine { animation: premiumShine 1.63s cubic-bezier(.4,0,.2,1); }
        .animate-premiumPulse {
          animation: premiumPulse 1.48s cubic-bezier(.4,0,.2,1);
        }
        @keyframes premiumPulse {
          0% { opacity: 0.7; transform: scale(1);}
          28% { opacity: 1; transform: scale(1.11);}
          89% { opacity: 1; transform: scale(1);}
          100% { opacity: 0.7; transform: scale(1);}
        }

        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #000 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>
    );
  }