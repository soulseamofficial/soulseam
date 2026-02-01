"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "../../components/Toast";

// ============================================================================
// FEATURE FLAG: Set to true to re-enable OTP verification
// ============================================================================
const OTP_ENABLED = true;

// ...constants unchanged...

const inputBase =
  "w-full rounded-xl px-4 py-3 bg-black/85 border font-semibold placeholder:text-white/35 text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/18 hover:border-white/20 hover:bg-black/90";
const inputError = "border-rose-400/70";
const inputDefault = "border-white/10";
const sectionCard =
  "bg-gradient-to-tr from-white/9 via-black/17 to-black/92 border border-white/12 rounded-2xl shadow-[0_6px_26px_rgba(255,255,255,0.06)] backdrop-blur-sm px-6 py-6 mb-7 animate-premiumSlideFadeIn";
const fieldSet = "flex gap-3";
const fieldSet2 = "grid grid-cols-1 sm:grid-cols-2 gap-3";
const sectionHead =
  "font-black tracking-wider text-lg mb-5 bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-transparent";
const premiumCardClass =
  "relative w-full max-w-lg mx-auto px-7 py-8 sm:p-10 rounded-3xl border border-white/14 shadow-[0_25px_90px_rgba(255,255,255,0.18)] bg-gradient-to-b from-white/8 via-black/25 to-black backdrop-blur-xl animate-premiumSlideFadeIn";
const submitBtn =
  "w-full mt-6 py-3 rounded-full font-extrabold tracking-widest text-black bg-gradient-to-r from-white to-zinc-200 shadow-[0_12px_36px_rgba(255,255,255,0.15)] hover:scale-[1.04] hover:shadow-[0_18px_48px_rgba(255,255,255,0.22)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi (NCT)","Jammu & Kashmir","Ladakh"
];

const CheckIcon = () => (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="text-green-400"
  >
    <circle cx="10" cy="10" r="9" stroke="currentColor" className="text-green-400/60" />
    <path
      d="M6.3 10.7l2.2 2.2 5.2-5.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

function VerificationCard({
  mode,
  active,
  verified,
  step,
  inputValue,
  otpValue,
  onInputChange,
  onRequestOtp,
  onOtpChange,
  onVerifyOtp,
  inputError,
  otpError,
  loading,
  disableInput,
  disableOtpSend,
  disableOtpVerify,
  devOtp,
  devMessage,
}) {
  const label = mode === "phone" ? "WhatsApp" : "Email";
  const desc = mode === "phone" ? "Contact via WhatsApp" : "Contact via Email";
  const placeholder = mode === "phone" ? "Enter phone number" : "Enter email id";
  const icon =
    mode === "phone" ? (
      <svg width="25" height="25" fill="none" viewBox="0 0 24 24" className="text-green-500">
        <rect width="24" height="24" rx="12" fill="currentColor" className="opacity-5"/>
        <path
          d="M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm5 13a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-2.12-5.47a7.7 7.7 0 0 0 2.08 2.09c.19.12.41.18.63.13.58-.14 2.4-.93 2.46-1 .07-.07.12-.2.1-.32-.06-.11-.26-.17-.33-.2a5.34 5.34 0 0 1-1.1-.5c-.25-.14-.53-.3-.67-.4-.17-.12-.34-.1-.44.04-.21.29-.4.52-.49.6-.08.09-.13.11-.26.04a7.4 7.4 0 0 1-2.21-2.22c-.07-.13-.06-.19.04-.27.09-.09.35-.35.5-.56.09-.13.13-.28.05-.44a8.1 8.1 0 0 1-.41-.67c-.15-.27-.32-.53-.52-.81-.09-.13-.22-.15-.38-.17-.14-.01-.29 0-.41.09-.17.12-1.13.84-1.14 1.02-.04.48.15 1.15.66 1.94.99 1.56 2.1 2.48 2.96 2.72Z"
          fill="currentColor"
        />
      </svg>
    ) : (
      <svg width="25" height="25" fill="none" viewBox="0 0 24 24" className="text-blue-400">
        <rect width="24" height="24" rx="12" fill="currentColor" className="opacity-5"/>
        <path
          d="M4 7.75V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v.75M4 7.75V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.75M4 7.75l8 5.25 8-5.25"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  if (!active) {
    // Visual-only card when not active
    return (
      <div
        className={`flex flex-col items-center gap-2 p-4 bg-gradient-to-tr rounded-2xl border shadow-[0_6px_26px_rgba(255,255,255,0.06)] backdrop-blur-sm select-none transition-all duration-300 ease-out min-h-[112px] cursor-pointer hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(255,255,255,0.12)] hover:border-white/25 from-white/9 via-black/17 to-black/92 border-white/12 opacity-70 hover:opacity-100`}
        style={{ marginBottom: 2 }}
      >
        <div className="flex items-center gap-2 w-full">
          <div className="flex-shrink-0">{icon}</div>
          <div className="flex flex-col flex-1 ml-2">
            <div className="font-semibold text-base text-white/60 mb-0.5">
              {label}
            </div>
            <div className="text-xs text-white/40">{desc}</div>
          </div>
        </div>
      </div>
    );
  }

  // Active card with input and OTP fields
  return (
    <div
      className={`flex flex-col gap-3 p-4 bg-gradient-to-tr rounded-2xl border shadow-[0_6px_26px_rgba(255,255,255,0.06)] backdrop-blur-sm transition-all duration-300 ease-out from-white/12 via-black/20 to-black/95 border-white/35 ring-2 ring-blue-500/60 shadow-lg z-10`}
      style={{ marginBottom: 2 }}
    >
      <div className="flex items-center gap-2 w-full mb-2">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex flex-col flex-1 ml-2">
          <div className="font-semibold text-base text-white/90 mb-0.5">
            {label}
          </div>
          <div className="text-xs text-white/40">{desc}</div>
        </div>
        {verified && (
          <div className="flex-shrink-0">
            <CheckIcon />
          </div>
        )}
      </div>

      {step === "input" && !verified && (
        <>
          <input
            type={mode === "phone" ? "tel" : "email"}
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              if (mode === "phone") {
                const phoneValue = e.target.value.replace(/[^\d]/g, "").slice(0, 10);
                onInputChange(mode, phoneValue);
              } else {
                onInputChange(mode, e.target.value);
              }
            }}
            className={`${inputBase} ${inputError ? inputError : inputDefault}`}
            disabled={disableInput || loading}
            autoComplete={mode === "phone" ? "tel" : "email"}
            inputMode={mode === "phone" ? "numeric" : "email"}
            maxLength={mode === "phone" ? 10 : undefined}
          />
          {inputError && (
            <div className="text-xs font-semibold text-rose-400 px-1">
              {typeof inputError === "string" ? inputError : `Enter valid ${mode === "phone" ? "phone number" : "email address"}`}
            </div>
          )}
          {mode === "phone" ? (
            <button
              type="button"
              onClick={() => onRequestOtp(mode)}
              disabled={disableOtpSend || loading || !inputValue}
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRequestOtp(mode)}
              disabled={disableOtpSend || loading || !inputValue}
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Continue"}
            </button>
          )}
        </>
      )}

      {step === "otp" && !verified && mode === "phone" && (
        <>
          <div className="text-xs text-white/60 mb-1">
            Enter the 6-digit code sent to +91{inputValue}
          </div>
          {/* Development Mode: Show OTP if WhatsApp API not configured */}
          {devOtp && devMessage && (
            <div className="mb-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div className="text-xs font-semibold text-yellow-400/90 mb-1">
                {devMessage}
              </div>
              <div className="text-lg font-bold text-yellow-300 text-center tracking-widest">
                {devOtp}
              </div>
            </div>
          )}
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otpValue}
            onChange={(e) => {
              const otpVal = e.target.value.replace(/[^\d]/g, "").slice(0, 6);
              onOtpChange(mode, otpVal);
            }}
            className={`${inputBase} ${otpError ? inputError : inputDefault}`}
            disabled={disableOtpVerify || loading}
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
          />
          {otpError && (
            <div className="text-xs font-semibold text-rose-400 px-1">
              {typeof otpError === "string" ? otpError : "Invalid OTP"}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onVerifyOtp(mode)}
              disabled={disableOtpVerify || loading || otpValue.length !== 6}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => onRequestOtp(mode)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-white/10 text-white hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend
            </button>
          </div>
        </>
      )}

      {verified && (
        <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
          <CheckIcon />
          <span>Verified</span>
        </div>
      )}
      {mode === "email" && step === "input" && !verified && (
        <div className="text-xs text-white/50 mt-2 px-1">
          Click Continue to proceed with email registration
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    pincode: "",
    country: "India"
  });

  const [verifyMode, setVerifyMode] = useState("email");

  const [verif, setVerif] = useState({
    phone: {
      step: "input",
      value: "",
      otp: "",
      loading: false,
      verified: false,
      inputError: false,
      otpError: false,
      devOtp: null,
      devMessage: null,
    },
    email: {
      step: "input",
      value: "",
      otp: "",
      loading: false,
      verified: false,
      inputError: false,
      otpError: false,
      devOtp: null,
      devMessage: null,
      showPasswordFields: false,
    }
  });

  const [pwError, setPwError] = useState({
    password: false,
    confirmPassword: false,
  });

  const [addressError, setAddressError] = useState({
    street: false,
    city: false,
    state: false,
    pincode: false,
    phone: false
  });

  const [submitting, setSubmitting] = useState(false);
  const [showEmailExistsPopup, setShowEmailExistsPopup] = useState(false);

  function handleNameChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Patch: Centralized numeric input handler for PIN code
  function handlePincodeChange(e) {
    const onlyDigits = e.target.value.replace(/[^\d]/g, "");
    // Allow less than 6 digits for typing, up to 6 total
    const newVal = onlyDigits.slice(0, 6);
    setForm(prev => ({ ...prev, pincode: newVal }));
    setAddressError(ae => ({ ...ae, pincode: false }));
  }

  function handleAddressChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setAddressError(ae => ({ ...ae, [name]: false }));
  }

  function handleInput(mode, val) {
    setVerif(prev => ({
      ...prev,
      [mode]: { ...prev[mode], value: val, inputError: false }
    }));
    
    // Update form state
    if (mode === "phone") {
      setForm(f => ({ ...f, phone: val.replace(/[^\d]/g, "") }));
    } else if (mode === "email") {
      setForm(f => ({ ...f, email: val.trim() }));
    }
  }

  function handleOtp(mode, val) {
    setVerif(prev => ({
      ...prev,
      [mode]: { ...prev[mode], otp: val, otpError: false }
    }));
  }

  async function handleSendOtp(mode) {
    setVerif(prev => ({
      ...prev,
      [mode]: { ...prev[mode], loading: true, inputError: false, otpError: false }
    }));

    if (mode === "phone") {
      const phoneVal = verif.phone.value.replace(/[^\d]/g, "");
      if (!/^[6-9]\d{9}$/.test(phoneVal)) {
        setVerif(prev => ({
          ...prev,
          phone: { ...prev.phone, loading: false, inputError: "Enter valid 10-digit phone number" }
        }));
        return;
      }

      // WhatsApp OTP flow (unchanged)
      try {
        const res = await fetch("/api/auth/whatsapp/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneVal }),
        });
        const data = await res.json();

        if (res.ok) {
          setVerif(prev => ({
            ...prev,
            phone: {
              ...prev.phone,
              loading: false,
              step: "otp",
              inputError: false,
              otpError: false,
              devOtp: data.devOtp || null,
              devMessage: data.devMessage || null,
            }
          }));
        } else {
          setVerif(prev => ({
            ...prev,
            phone: {
              ...prev.phone,
              loading: false,
              inputError: data.message || "Failed to send OTP"
            }
          }));
        }
      } catch (err) {
        setVerif(prev => ({
          ...prev,
          phone: { ...prev.phone, loading: false, inputError: "Network error" }
        }));
      }
    } else if (mode === "email") {
      // Email flow: Just validate and show password fields (no OTP)
      if (!/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(verif.email.value)) {
        setVerif(prev => ({
          ...prev,
          email: { ...prev.email, loading: false, inputError: "Enter valid email address" }
        }));
        return;
      }

      // Show password fields for email
      setVerif(prev => ({
        ...prev,
        email: {
          ...prev.email,
          loading: false,
          showPasswordFields: true,
          inputError: false,
        }
      }));
    }
  }

  async function handleVerifyOtp(mode) {
    setVerif(prev => ({
      ...prev,
      [mode]: { ...prev[mode], loading: true, otpError: false }
    }));

    const otpVal = verif[mode].otp.trim();
    if (!/^\d{6}$/.test(otpVal)) {
      setVerif(prev => ({
        ...prev,
        [mode]: { ...prev[mode], loading: false, otpError: "Enter 6 digit code" }
      }));
      return;
    }

    const api =
      mode === "phone"
        ? "/api/auth/whatsapp/verify-otp"
        : "/api/auth/email/verify-otp";
    const payload =
      mode === "phone"
        ? { phone: verif.phone.value.replace(/[^\d]/g, ""), otp: otpVal }
        : { email: verif.email.value.trim(), otp: otpVal };

    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.verified) {
        setVerif(prev => ({
          ...prev,
          [mode]: {
            ...prev[mode],
            otp: "",
            loading: false,
            verified: true,
            otpError: false
          }
        }));

        if (mode === "phone") {
          setForm(f => ({ ...f, phone: verif.phone.value.replace(/[^\d]/g, "") }));
        }
      } else {
        setVerif(prev => ({
          ...prev,
          [mode]: {
            ...prev[mode],
            loading: false,
            otpError: data.error || "Incorrect code"
          }
        }));
      }
    } catch (err) {
      setVerif(prev => ({
        ...prev,
        [mode]: { ...prev[mode], loading: false, otpError: "Verification error" }
      }));
    }
  }

  function selectMode(mode) {
    setVerifyMode(mode);
  }

  function checkPwValid(pw, confirm) {
    const minLen = 6;
    return (
      typeof pw === "string" &&
      typeof confirm === "string" &&
      pw.length >= minLen &&
      confirm.length >= minLen &&
      pw === confirm
    );
  }

  function validatePw() {
    const e = {
      password: false,
      confirmPassword: false,
    };
    if (!form.password || form.password.length < 6) e.password = true;
    if (form.password !== form.confirmPassword) e.confirmPassword = true;
    setPwError(e);
    return !e.password && !e.confirmPassword;
  }

  function validateAddressAndSetErrors(f, vMode) {
    const errors = {
      street: !f.street || !f.street.trim(),
      city: !f.city || !f.city.trim(),
      state: !f.state || !STATES.includes(f.state),
      pincode: !/^\d{6}$/.test(f.pincode || ""),
      // Phone validation removed - no longer required
      phone: false
    };
    setAddressError(errors);
    return !errors.street && !errors.city && !errors.state && !errors.pincode;
  }

  const isVerified = verifyMode === "email" 
    ? (verif.email.showPasswordFields && verif.email.value) 
    : verif[verifyMode].verified;
  // Password validation only required for email registration
  const pwValid = verifyMode === "email" 
    ? checkPwValid(form.password, form.confirmPassword)
    : true;
  const addressValid = isVerified && !Object.values(addressError).some(Boolean);
  const canSubmit = !submitting && form.firstName && form.lastName && isVerified && pwValid && addressValid;

  async function handleRegister(e) {
    e.preventDefault();

    // Only validate password for email registration
    if (verifyMode === "email" && !validatePw()) return;

    if (!validateAddressAndSetErrors(form, verifyMode)) return;

    if (!canSubmit) return;

    setSubmitting(true);

    const name = `${form.firstName} ${form.lastName}`.trim();
    const email = verifyMode === "email" ? verif.email.value.trim().toLowerCase() : (form.email.trim().toLowerCase() || "");
    const phone = verifyMode === "phone" ? verif.phone.value.replace(/[^\d]/g, "") : (form.phone || "");

    try {
      if (verifyMode === "email") {
        // Firebase email/password registration
        const firebaseRes = await fetch("/api/auth/email/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: form.password,
          }),
        });

        const firebaseData = await firebaseRes.json();

        if (!firebaseRes.ok) {
          // Handle email already exists error with popup
          if (firebaseRes.status === 400 && (
            firebaseData.message?.toLowerCase().includes("already") ||
            firebaseData.message?.toLowerCase().includes("login")
          )) {
            setShowEmailExistsPopup(true);
          } else {
            showToast(firebaseData.message || "Registration failed", "error");
          }
          setSubmitting(false);
          return;
        }

        // Create user in MongoDB - only include email (no phone for email registration)
        const payload = {
          name,
          email,
          password: form.password,
          firebaseUid: firebaseData.uid,
          address: {
            addressLine1: form.street,
            addressLine2: form.apartment,
            city: form.city,
            state: form.state,
            country: "India",
            pincode: form.pincode
          }
        };

        const res = await fetch("/api/auth/user/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (res.ok) {
          showToast("Verification email sent. Please verify your email before logging in.", "success");
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        } else {
          showToast(data?.message || "Registration failed", "error");
        }
      } else {
        // Phone/WhatsApp registration - only include phone (no email, no password for phone registration)
        const payload = {
          name,
          phone,
          address: {
            addressLine1: form.street,
            addressLine2: form.apartment,
            city: form.city,
            state: form.state,
            country: "India",
            pincode: form.pincode
          }
        };

        const res = await fetch("/api/auth/user/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (res.ok) {
          router.push("/profile");
        } else {
          showToast(data?.message || "Registration failed", "error");
        }
      }
    } catch (err) {
      showToast("Failed to register. Please try again.", "error");
    }

    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-2 py-8">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.95) 55%)",
        }}
      />

      <div className={premiumCardClass} style={{ minWidth: 0 }}>
        <h1 className="text-3xl font-extrabold mb-6 sm:mb-8 text-center bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-transparent tracking-widest">
          Account Information
        </h1>

        <form className="w-full" autoComplete="off" onSubmit={handleRegister}>
          <div className={`${fieldSet} mb-7 animate-premiumSlideFadeIn`}>
            <input
              name="firstName"
              placeholder="First name"
              value={form.firstName}
              onChange={handleNameChange}
              className={`${inputBase} ${inputDefault}`}
              autoComplete="given-name"
              required
              spellCheck={false}
            />
            <input
              name="lastName"
              placeholder="Last name"
              value={form.lastName}
              onChange={handleNameChange}
              className={`${inputBase} ${inputDefault}`}
              autoComplete="family-name"
              required
              spellCheck={false}
            />
          </div>

          <div className={sectionCard} style={{ animationDelay: "0.1s" }}>
            <div className={sectionHead}>Shipping Address</div>

            <div className={fieldSet + " mb-3"}>
              <input
                name="street"
                placeholder="Street address"
                className={
                  inputBase + " " + (addressError.street ? inputError : inputDefault)
                }
                autoComplete="address-line1"
                value={form.street}
                onChange={handleAddressChange}
                required
                spellCheck={false}
              />
              <input
                name="apartment"
                placeholder="Apartment / Suite (optional)"
                className={inputBase + " " + inputDefault}
                autoComplete="address-line2"
                value={form.apartment}
                onChange={handleAddressChange}
                spellCheck={false}
              />
            </div>

            <div className={fieldSet + " mb-3"}>
              <select
                name="country"
                value="India"
                className={inputBase + " bg-black/50 border-white/20 opacity-70 pointer-events-none"}
                disabled
                style={{ maxWidth: 140, flex: "0 0 140px" }}
                tabIndex={-1}
              >
                <option value="India">India</option>
              </select>
              <input
                name="pincode"
                placeholder="PIN code"
                className={
                  inputBase + " " + (addressError.pincode ? inputError : inputDefault)
                }
                autoComplete="postal-code"
                value={form.pincode}
                onChange={handlePincodeChange}
                maxLength={6}
                required
                inputMode="numeric"
                spellCheck={false}
                pattern="[0-9]*"
              />
            </div>

            <div className={fieldSet + " mb-3"}>
              <input
                name="city"
                placeholder="City"
                className={
                  inputBase + " " + (addressError.city ? inputError : inputDefault)
                }
                autoComplete="address-level2"
                value={form.city}
                onChange={handleAddressChange}
                required
                spellCheck={false}
              />
              <select
                name="state"
                className={
                  inputBase +
                  " " +
                  (addressError.state ? inputError : inputDefault) +
                  " pr-8"
                }
                value={form.state}
                onChange={handleAddressChange}
                autoComplete="address-level1"
                required
              >
                <option value="">Select State</option>
                {STATES.map(s => (
                  <option value={s} key={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Phone number field removed - no longer required */}
          </div>

          {/* Contact method selection and verification */}
          <div className="mb-6" style={{ animationDelay: "0.2s" }}>
            <div className="text-sm font-semibold text-white/70 mb-3">
              Verify your contact information
            </div>
            <div className="flex gap-3 mb-4">
              <div
                className="flex-1 min-w-0 animate-premiumSlideFadeIn"
                style={{ animationDelay: "0.25s" }}
                onClick={() => selectMode("phone")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectMode("phone");
                  }
                }}
              >
                <VerificationCard
                  mode="phone"
                  active={verifyMode === "phone"}
                  verified={verif.phone.verified}
                  step={verif.phone.step}
                  inputValue={verif.phone.value}
                  otpValue={verif.phone.otp}
                  onInputChange={handleInput}
                  onRequestOtp={handleSendOtp}
                  onOtpChange={handleOtp}
                  onVerifyOtp={handleVerifyOtp}
                  inputError={verif.phone.inputError}
                  otpError={verif.phone.otpError}
                  loading={verif.phone.loading}
                  disableInput={false}
                  disableOtpSend={false}
                  disableOtpVerify={false}
                  devOtp={verif.phone.devOtp}
                  devMessage={verif.phone.devMessage}
                />
              </div>

              <div
                className="flex-1 min-w-0 animate-premiumSlideFadeIn"
                style={{ animationDelay: "0.3s" }}
                onClick={() => selectMode("email")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectMode("email");
                  }
                }}
              >
                <VerificationCard
                  mode="email"
                  active={verifyMode === "email"}
                  verified={verif.email.verified}
                  step={verif.email.step}
                  inputValue={verif.email.value}
                  otpValue={verif.email.otp}
                  onInputChange={handleInput}
                  onRequestOtp={handleSendOtp}
                  onOtpChange={handleOtp}
                  onVerifyOtp={handleVerifyOtp}
                  inputError={verif.email.inputError}
                  otpError={verif.email.otpError}
                  loading={verif.email.loading}
                  disableInput={false}
                  disableOtpSend={false}
                  disableOtpVerify={false}
                  devOtp={verif.email.devOtp}
                  devMessage={verif.email.devMessage}
                />
              </div>
            </div>
            {!isVerified && (
              <div className="text-xs text-yellow-400/70 text-center mt-2">
                {verifyMode === "phone" ? "• Enter phone number" : "• Enter email id and click Continue"}
              </div>
            )}
          </div>

          {verifyMode === "email" && (isVerified || verif.email.showPasswordFields) && (
            <div className={sectionCard} style={{ animationDelay: "0.35s" }}>
              <div className={sectionHead}>Create Password</div>

              <div className={fieldSet + " mb-3"}>
                <input
                  name="password"
                  type="password"
                  placeholder="Create password (min. 6 letters)"
                  className={
                    inputBase +
                    " bg-black/80 " +
                    (pwError.password ? inputError : inputDefault)
                  }
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => {
                    setForm(f => ({ ...f, password: e.target.value }));
                    setPwError(e2 => ({
                      ...e2,
                      password: false,
                      confirmPassword: false
                    }));
                  }}
                  minLength={6}
                  required
                />
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  className={
                    inputBase +
                    " bg-black/80 " +
                    (pwError.confirmPassword ? inputError : inputDefault)
                  }
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={e => {
                    setForm(f => ({ ...f, confirmPassword: e.target.value }));
                    setPwError(e2 => ({
                      ...e2,
                      password: false,
                      confirmPassword: false
                    }));
                  }}
                  minLength={6}
                  required
                />
              </div>

              {form.password &&
                form.confirmPassword &&
                form.password !== form.confirmPassword && (
                  <div className="mt-1 text-xs font-semibold text-rose-400 px-1">
                    Passwords do not match
                  </div>
                )}
            </div>
          )}

          <button type="submit" className={submitBtn} disabled={!canSubmit}>
            {submitting ? "Creating..." : "Create Account"}
          </button>

          {/* Development Debug Helper */}
          {!canSubmit && (
            <div className="mt-3 text-xs text-yellow-400/70 text-center">
              {!form.firstName && "• Enter first name"}
              {!form.lastName && "• Enter last name"}
              {!isVerified && (verifyMode === "phone" ? "• Verify phone number with OTP" : "• Enter email and click Continue")}
              {verifyMode === "email" && !pwValid && form.password && "• Passwords must match (min. 6 chars)"}
              {!addressValid && isVerified && "• Complete address fields"}
            </div>
          )}
        </form>

        <div className="mt-7 text-center text-sm text-white/55">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-white font-bold underline cursor-pointer hover:text-white/80 transition-colors"
            tabIndex={0}
            role="button"
          >
            Login
          </span>
        </div>
      </div>

      {/* Email Already Exists Popup */}
      {showEmailExistsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md bg-gradient-to-b from-white/10 via-black/30 to-black/95 border border-white/20 rounded-3xl shadow-[0_25px_90px_rgba(255,255,255,0.25)] backdrop-blur-xl p-8 animate-premiumSlideFadeIn">
            <button
              onClick={() => setShowEmailExistsPopup(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white/90 transition-colors"
              aria-label="Close"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500/30 mb-4">
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-yellow-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold mb-3 bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-transparent">
                Account Already Exists
              </h2>
              <p className="text-white/70 text-sm leading-relaxed">
                Looks like you already have an account with this email.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowEmailExistsPopup(false);
                  router.push("/login");
                }}
                className="w-full py-3 rounded-full font-extrabold tracking-widest text-black bg-gradient-to-r from-white to-zinc-200 shadow-[0_12px_36px_rgba(255,255,255,0.15)] hover:scale-[1.04] hover:shadow-[0_18px_48px_rgba(255,255,255,0.22)] transition-all duration-300"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setShowEmailExistsPopup(false);
                  router.push("/login?forgot=true");
                }}
                className="w-full py-3 rounded-full font-semibold text-white/90 bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                Forgot Password
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes premiumSlideFadeIn {
          from {
            opacity: 0;
            transform: scale(0.98) translateY(30px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .animate-premiumSlideFadeIn {
          animation: premiumSlideFadeIn 0.8s cubic-bezier(0.4,0,0.2,1) both;
        }
      `}</style>
    </div>
  );
}