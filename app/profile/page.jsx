"use client";

import { useEffect, useMemo, useState, useRef, useCallback, useContext, createContext } from "react";
import { useRouter } from "next/navigation";

// Premium input styling classes
const inputClassReadOnly =
  "w-full rounded-xl px-4 py-3 bg-black/50 border border-white/10 text-white/70 placeholder-white/30 cursor-not-allowed transition-all duration-300";

const inputClassEditable =
  "w-full rounded-xl px-4 py-3 bg-black/70 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-300";

const inputClassImmutable =
  "w-full rounded-xl px-4 py-3 bg-black/40 border border-white/8 text-white/50 placeholder-white/20 cursor-not-allowed opacity-70 transition-all duration-300";

// Premium button styling
const buttonPrimaryClass =
  "px-6 py-3 rounded-xl bg-gradient-to-r from-white to-zinc-200 text-black font-extrabold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

const buttonSecondaryClass =
  "px-6 py-3 rounded-xl border-2 border-white/20 bg-black/40 text-white font-bold uppercase tracking-wider transition-all duration-300 hover:border-white/40 hover:bg-black/60 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(255,255,255,0.1)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

const buttonDangerClass =
  "px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 font-semibold transition-all duration-300 hover:bg-red-500/20 hover:border-red-500/50 hover:scale-[1.02] active:scale-[0.98]";

const buttonEditClass =
  "px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white font-semibold transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98]";

// Accordion styling (matching product page pattern)
const glassAccordion = "rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/8 via-white/2 to-white/0 backdrop-blur-md mb-2";

// ---- Accordion Group Context for Only-One-Open UX ---- //
const AccordionGroupContext = createContext();

function AccordionGroup({ openKey, setOpenKey, children }) {
  return (
    <AccordionGroupContext.Provider value={{ openKey, setOpenKey }}>
      {children}
    </AccordionGroupContext.Provider>
  );
}

function useAccordionGroup() {
  return useContext(AccordionGroupContext);
}

function LuxuryAccordion({ title, children, defaultOpen, accordionKey }) {
  const contentRef = useRef(null);
  const group = useAccordionGroup();
  const isInGroup = !!group && typeof accordionKey === "string";
  const [localOpen, setLocalOpen] = useState(!!defaultOpen);
  const open = isInGroup
    ? group.openKey === accordionKey
    : localOpen;

  const handleToggle = useCallback(() => {
    if (isInGroup) {
      if (open) {
        group.setOpenKey(null);
      } else {
        group.setOpenKey(accordionKey);
      }
    } else {
      setLocalOpen((v) => !v);
    }
  }, [isInGroup, open, group, accordionKey]);

  useEffect(() => {
    if (isInGroup && defaultOpen && !group.openKey) {
      group.setOpenKey(accordionKey);
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div className={glassAccordion}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left text-lg font-semibold tracking-wide text-white/90 hover:bg-white/5 transition-colors duration-200"
        aria-expanded={open}
        type="button"
        tabIndex={0}
      >
        <span>{title}</span>
        <svg width={22} height={22} className={"transition-transform duration-300 " + (open ? "rotate-90" : "rotate-0")} viewBox="0 0 22 22" fill="none"><path d="M7 8l4 4 4-4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div
        ref={contentRef}
        style={{
          maxHeight: open
            ? 9999
            : 0,
          transition: "max-height 340ms cubic-bezier(0.75,0,0.38,1)",
          overflow: "hidden",
        }}
        aria-hidden={!open}
      >
        <div className="px-6 pb-6 pt-2 text-white/75 text-base leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function emptyAddress() {
  return {
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Address management state
  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState(emptyAddress());
  const [editingId, setEditingId] = useState(null);
  const [savingAddr, setSavingAddr] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState(null);

  // Accordion state - only one section open at a time
  const [openAccordionKey, setOpenAccordionKey] = useState(null);

  const canSaveAddr = useMemo(() => {
    const a = addrForm;
    return (
      a.fullName &&
      /^[6-9]\d{9}$/.test(a.phone || "") &&
      a.addressLine1 &&
      a.city &&
      a.state &&
      /^\d{6}$/.test(a.pincode || "") &&
      a.country
    );
  }, [addrForm]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/auth/user/me", { credentials: "include" });
    const data = await res.json();
    if (!data?.user) {
      router.push("/login");
      return;
    }
    setUser(data.user);
    setEditName(data.user.name || "");
    setAddresses(Array.isArray(data.user.addresses) ? data.user.addresses : []);
    setLoading(false);
  }

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/users/orders", { credentials: "include" });
      if (!res.ok) {
        console.error("Failed to load orders:", res.status, res.statusText);
        setOrders([]);
        return;
      }
      const data = await res.json();
      // Defensive check: ensure data.success === true and data.orders is an array
      if (data && data.success === true && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        console.warn("Invalid orders response shape:", data);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    load();
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    if (!editName.trim()) {
      alert("Name cannot be empty");
      return;
    }
    setSavingProfile(true);
    const res = await fetch("/api/users/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: editName.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingProfile(false);
    if (!res.ok) {
      alert(data?.message || "Failed to update profile");
      return;
    }
    setIsEditingProfile(false);
    await load();
  }

  function cancelEditProfile() {
    setEditName(user?.name || "");
    setIsEditingProfile(false);
  }

  async function logout() {
    if (!confirm("Are you sure you want to logout?")) return;
    await fetch("/api/auth/user/logout", { method: "POST", credentials: "include" });
    router.push("/");
  }

  function startEditAddress(a) {
    setEditingId(a._id);
    setAddrForm({
      fullName: a.fullName || "",
      phone: a.phone || "",
      addressLine1: a.addressLine1 || "",
      addressLine2: a.addressLine2 || "",
      city: a.city || "",
      state: a.state || "",
      pincode: a.pincode || "",
      country: a.country || "India",
    });
    setShowAddressForm(true);
  }

  function resetAddrForm() {
    setEditingId(null);
    setAddrForm(emptyAddress());
    setShowAddressForm(false);
  }

  function handleAddNewAddress() {
    resetAddrForm();
    setShowAddressForm(true);
  }

  async function saveAddress() {
    if (!canSaveAddr) {
      alert("Please fill all required fields correctly:\n- Full Name\n- Phone (10 digits starting with 6-9)\n- Address Line 1\n- City\n- State\n- Pincode (6 digits)\n- Country");
      return;
    }
    setSavingAddr(true);
    try {
      const url = editingId ? `/api/users/addresses/${editingId}` : "/api/users/addresses";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(addrForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.message || "Failed to save address");
        setSavingAddr(false);
        return;
      }
      resetAddrForm();
      await load();
      setSavingAddr(false);
    } catch (error) {
      console.error("Error saving address:", error);
      alert("An error occurred while saving the address. Please try again.");
      setSavingAddr(false);
    }
  }

  async function deleteAddress(id) {
    if (!confirm("Are you sure you want to delete this address?")) return;
    const res = await fetch(`/api/users/addresses/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) await load();
  }

  async function handlePayNow(order) {
    // Only allow payment for COD orders with PENDING status
    if (order.paymentMethod !== "COD" || order.paymentStatus !== "PENDING") {
      alert("This order is not eligible for payment.");
      return;
    }

    setPayingOrderId(order._id);

    try {
      // Step 1: Create Razorpay order
      const payRes = await fetch(`/api/orders/${order._id}/pay`, {
        method: "GET",
        credentials: "include",
      });

      let payData;
      try {
        const responseText = await payRes.text();
        try {
          payData = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse payment response as JSON:", parseError);
          console.error("Raw response text:", responseText);
          alert("Failed to initialize payment. Invalid response from server.");
          setPayingOrderId(null);
          return;
        }
      } catch (readError) {
        console.error("Failed to read payment response:", readError);
        alert("Failed to initialize payment. Please check your connection and try again.");
        setPayingOrderId(null);
        return;
      }

      if (!payRes.ok || !payData.success) {
        const errorMessage = payData?.error || "Failed to initialize payment. Please try again.";
        console.error("Payment initialization failed:", {
          status: payRes.status,
          statusText: payRes.statusText,
          error: payData?.error,
          response: payData,
          orderId: order._id
        });
        alert(errorMessage);
        setPayingOrderId(null);
        return;
      }

      // Validate response data
      if (!payData.razorpayOrderId || !payData.amount) {
        console.error("Invalid payment response data:", payData);
        alert("Invalid response from payment gateway. Please try again.");
        setPayingOrderId(null);
        return;
      }

      // Check if Razorpay key is configured for client-side checkout
      const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        alert("Payment gateway is not fully configured. Please contact support.");
        setPayingOrderId(null);
        return;
      }

      // Step 2: Open Razorpay Checkout
      if (typeof window === "undefined") {
        setPayingOrderId(null);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: payData.amount,
        currency: "INR",
        name: "SOULSEAM",
        description: `Payment for Order #${order._id.slice(-8).toUpperCase()}`,
        order_id: payData.razorpayOrderId,
        handler: async function (response) {
          try {
            // Step 3: Verify payment on backend
            const verifyRes = await fetch(`/api/orders/${order._id}/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            console.log("Payment verification response:", verifyData);

            // Check success explicitly
            if (verifyData.success === true) {
              // Payment successful - reload orders to show updated status
              alert("Payment successful! Your order has been updated.");
              await loadOrders();
              setPayingOrderId(null);
            } else {
              // Verification failed
              alert(verifyData.error || "Payment verification failed. Please contact support.");
              setPayingOrderId(null);
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment completed but verification failed. Please contact support with your payment ID.");
            setPayingOrderId(null);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone ? `+91${user.phone}` : "",
        },
        theme: { color: "#000000" },
        modal: {
          ondismiss: function () {
            // User closed the payment modal
            setPayingOrderId(null);
          },
        },
      };

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existingScript) {
          // Script is loading, wait for it
          existingScript.addEventListener('load', () => {
            if (window.Razorpay) {
              new window.Razorpay(options).open();
            } else {
              alert("Failed to load payment gateway. Please try again.");
              setPayingOrderId(null);
            }
          });
          existingScript.addEventListener('error', () => {
            alert("Failed to load payment gateway. Please try again.");
            setPayingOrderId(null);
          });
        } else {
          // Create and load script
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = () => {
            if (window.Razorpay) {
              new window.Razorpay(options).open();
            } else {
              alert("Failed to load payment gateway. Please try again.");
              setPayingOrderId(null);
            }
          };
          script.onerror = () => {
            alert("Failed to load payment gateway. Please try again.");
            setPayingOrderId(null);
          };
          document.body.appendChild(script);
        }
      } else {
        // Razorpay is already loaded, open checkout
        new window.Razorpay(options).open();
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      alert("An error occurred while initializing payment. Please try again.");
      setPayingOrderId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/30 mb-4"></div>
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-10 animate-fade-in-up">
        <h1 className="text-4xl font-black uppercase tracking-[0.2em] bg-gradient-to-r from-white via-white/90 to-zinc-200/70 bg-clip-text text-transparent drop-shadow-[0_4px_22px_rgba(255,255,255,0.18)]">
          PROFILE
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className={`${buttonSecondaryClass} text-sm flex items-center gap-2`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <button
            onClick={logout}
            className={`${buttonSecondaryClass} text-sm`}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Profile Information Card */}
      <div className="bg-gradient-to-b from-black/80 via-zinc-900/68 to-black/99 border border-white/14 rounded-3xl p-8 mb-8 shadow-[0_22px_60px_rgba(255,255,255,0.12)] transition-all duration-600 ease-out hover:shadow-[0_28px_80px_rgba(255,255,255,0.15)] animate-reveal">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black uppercase tracking-[0.15em] bg-gradient-to-r from-white via-white/90 to-zinc-200/70 bg-clip-text text-transparent">
            User Information
          </h2>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className={buttonEditClass}
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Name
            </label>
            <input
              className={isEditingProfile ? inputClassEditable : inputClassReadOnly}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={!isEditingProfile}
              placeholder="Your full name"
            />
          </div>

          {/* Phone Field - IMMUTABLE */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
              Phone
              <span className="text-[10px] text-white/40 font-normal normal-case">(immutable)</span>
              <svg
                className="w-3 h-3 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </label>
            <input
              className={inputClassImmutable}
              value={user?.phone ? `+91 ${user.phone}` : ""}
              readOnly
              disabled
              placeholder="Phone number"
            />
          </div>

          {/* Email Field - IMMUTABLE */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
              Email
              <span className="text-[10px] text-white/40 font-normal normal-case">(immutable)</span>
              <svg
                className="w-3 h-3 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </label>
            <input
              className={inputClassImmutable}
              value={user?.email || ""}
              readOnly
              disabled
              placeholder="Email address"
            />
          </div>
        </div>

        {/* Edit Profile Actions */}
        {isEditingProfile && (
          <div className="mt-6 flex gap-4 animate-fade-in-up">
            <button
              onClick={saveProfile}
              disabled={savingProfile || !editName.trim()}
              className={buttonPrimaryClass}
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={cancelEditProfile}
              disabled={savingProfile}
              className={buttonSecondaryClass}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Dropdown Sections: Saved Addresses and Your Orders */}
      <div className="mb-8 animate-reveal delay-200">
        <AccordionGroup openKey={openAccordionKey} setOpenKey={setOpenAccordionKey}>
          {/* Saved Addresses Accordion */}
          <LuxuryAccordion title="Saved Addresses" accordionKey="addresses">
            <div className="space-y-4">
              {!showAddressForm && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleAddNewAddress}
                    className={buttonEditClass}
                  >
                    + Add New Address
                  </button>
                </div>
              )}

              {/* Address List */}
              {addresses.length === 0 && !showAddressForm ? (
                <div className="text-white/60 text-center py-8 italic">No saved addresses.</div>
              ) : (
                <div className="space-y-4 mb-8">
                  {addresses.map((a) => (
                    <div
                      key={a._id}
                      className="border border-white/10 rounded-2xl p-5 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-black/50 hover:shadow-[0_8px_24px_rgba(255,255,255,0.08)]"
                    >
                      <div className="font-bold text-lg mb-2">{a.fullName}</div>
                      <div className="text-white/70 text-sm mb-1">+91 {a.phone}</div>
                      <div className="text-white/70 text-sm mb-4">
                        {[a.addressLine1, a.addressLine2, a.city, a.state, a.pincode, a.country]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditAddress(a)}
                          className={buttonEditClass}
                          disabled={showAddressForm}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAddress(a._id)}
                          className={buttonDangerClass}
                          disabled={showAddressForm}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Address Form - Hidden by default, shown with animation */}
              {showAddressForm && (
                <div className="border-t border-white/10 pt-6 mt-6 animate-fade-in-up">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold uppercase tracking-wider">
                      {editingId ? "Edit Address" : "Add New Address"}
                    </h3>
                    <button
                      onClick={resetAddrForm}
                      className="text-white/60 hover:text-white transition-colors text-sm"
                      disabled={savingAddr}
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      className={inputClassEditable}
                      placeholder="Full Name"
                      value={addrForm.fullName}
                      onChange={(e) => setAddrForm((s) => ({ ...s, fullName: e.target.value }))}
                      disabled={savingAddr}
                    />
                    <input
                      className={inputClassEditable}
                      placeholder="Phone"
                      value={addrForm.phone}
                      onChange={(e) =>
                        setAddrForm((s) => ({ ...s, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                      }
                      disabled={savingAddr}
                    />
                    <input
                      className={inputClassEditable}
                      placeholder="Address Line 1"
                      value={addrForm.addressLine1}
                      onChange={(e) => setAddrForm((s) => ({ ...s, addressLine1: e.target.value }))}
                      disabled={savingAddr}
                    />
                    <input
                      className={inputClassEditable}
                      placeholder="Address Line 2 (Optional)"
                      value={addrForm.addressLine2}
                      onChange={(e) => setAddrForm((s) => ({ ...s, addressLine2: e.target.value }))}
                      disabled={savingAddr}
                    />
                    <input
                      className={inputClassEditable}
                      placeholder="City"
                      value={addrForm.city}
                      onChange={(e) => setAddrForm((s) => ({ ...s, city: e.target.value }))}
                      disabled={savingAddr}
                    />
                    <input
                      className={inputClassEditable}
                      placeholder="State"
                      value={addrForm.state}
                      onChange={(e) => setAddrForm((s) => ({ ...s, state: e.target.value }))}
                      disabled={savingAddr}
                    />
                    <input
                      className={inputClassEditable}
                      placeholder="Pincode"
                      value={addrForm.pincode}
                      onChange={(e) =>
                        setAddrForm((s) => ({ ...s, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))
                      }
                      disabled={savingAddr}
                    />
                    <input
                      className={inputClassEditable}
                      placeholder="Country"
                      value={addrForm.country}
                      onChange={(e) => setAddrForm((s) => ({ ...s, country: e.target.value }))}
                      disabled={savingAddr}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={saveAddress}
                    disabled={!canSaveAddr || savingAddr}
                    className={`${buttonPrimaryClass} mt-6`}
                  >
                    {savingAddr ? "Saving..." : "Save Address"}
                  </button>
                </div>
              )}
            </div>
          </LuxuryAccordion>

          {/* Your Orders Accordion */}
          <LuxuryAccordion title="Your Orders" accordionKey="orders">
            <div className="space-y-4">
              {loadingOrders ? (
                <div className="text-white/60 text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/30 mb-4"></div>
                  <p>Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-white/60 text-center py-8 italic">No orders found.</div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="border border-white/10 rounded-2xl p-5 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-black/50 hover:shadow-[0_8px_24px_rgba(255,255,255,0.08)]"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                        <div>
                          <div className="font-bold text-lg mb-1">Order #{order._id.slice(-8).toUpperCase()}</div>
                          <div className="text-white/70 text-sm">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <div className="mt-2 md:mt-0 text-right">
                          <div className="font-bold text-lg mb-1">
                            ₹{((order.totalAmount || order.total || 0)).toLocaleString("en-IN")}
                          </div>
                          <div className="text-xs uppercase tracking-wider">
                            <span className={`px-2 py-1 rounded ${
                              (order.orderStatus || "CREATED") === "DELIVERED" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                              (order.orderStatus || "CREATED") === "SHIPPED" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                              (order.orderStatus || "CREATED") === "CONFIRMED" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                              (order.orderStatus || "CREATED") === "CANCELLED" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                              (order.orderStatus || "CREATED") === "PENDING" || (order.orderStatus || "CREATED") === "CREATED" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                              "bg-white/10 text-white/70 border border-white/20"
                            }`}>
                              {order.orderStatus || "CREATED"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-white/10 pt-4 mt-4">
                        <div className="text-sm font-semibold mb-2 text-white/90">Items:</div>
                        <div className="space-y-2">
                          {Array.isArray(order.items) && order.items.length > 0 ? (
                            order.items.map((item, idx) => (
                              <div key={item.productId || idx} className="flex items-center gap-3 text-sm text-white/70">
                                <span className="font-medium">{item.quantity || 1}x</span>
                                <span>{item.name || "Unknown Item"}</span>
                                {item.size && <span className="text-white/50">({item.size})</span>}
                                <span className="ml-auto">₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-white/50 text-sm italic">No items found</div>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-4 mt-4 flex flex-col gap-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
                          <div className="text-white/60">
                            <span className="font-semibold text-white/80">Payment:</span> {order.paymentMethod || "N/A"} - 
                            <span className={`ml-1 font-semibold ${
                              (order.paymentStatus || "PENDING") === "PAID" ? "text-green-400" :
                              (order.paymentStatus || "PENDING") === "FAILED" ? "text-red-400" :
                              (order.paymentStatus || "PENDING") === "PENDING" ? "text-yellow-400" :
                              "text-yellow-400"
                            }`}>
                              {order.paymentStatus || "PENDING"}
                            </span>
                          </div>
                          {order.delhiveryTrackingUrl && (
                            <a
                              href={order.delhiveryTrackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline text-sm"
                            >
                              Track Order
                            </a>
                          )}
                        </div>
                        {(order.paymentStatus || "PENDING") === "PENDING" && (order.paymentMethod || "") === "COD" && (
                          <button
                            onClick={() => handlePayNow(order)}
                            disabled={payingOrderId === order._id || !order._id}
                            className={`${buttonPrimaryClass} text-sm w-full md:w-auto self-start`}
                          >
                            {payingOrderId === order._id ? "Processing..." : "Pay Now"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </LuxuryAccordion>
        </AccordionGroup>
      </div>
    </div>
  );
}