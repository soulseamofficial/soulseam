"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    load();
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

      {/* Addresses Section */}
      <div className="bg-gradient-to-b from-black/80 via-zinc-900/68 to-black/99 border border-white/14 rounded-3xl p-8 shadow-[0_22px_60px_rgba(255,255,255,0.12)] transition-all duration-600 ease-out hover:shadow-[0_28px_80px_rgba(255,255,255,0.15)] animate-reveal delay-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black uppercase tracking-[0.15em] bg-gradient-to-r from-white via-white/90 to-zinc-200/70 bg-clip-text text-transparent">
            Saved Addresses
          </h2>
          {!showAddressForm && (
            <button
              onClick={handleAddNewAddress}
              className={buttonEditClass}
            >
              + Add New Address
            </button>
          )}
        </div>

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
    </div>
  );
}
