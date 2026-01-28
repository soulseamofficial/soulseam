"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-xl px-4 py-3 bg-black/70 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition";

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

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState(emptyAddress());
  const [editingId, setEditingId] = useState(null);
  const [savingAddr, setSavingAddr] = useState(false);

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
    setEditPhone(data.user.phone || "");
    setAddresses(Array.isArray(data.user.addresses) ? data.user.addresses : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    setSavingProfile(true);
    const res = await fetch("/api/users/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: editName, phone: editPhone }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingProfile(false);
    if (!res.ok) {
      alert(data?.message || "Failed to update profile");
      return;
    }
    await load();
  }

  async function logout() {
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
  }

  function resetAddrForm() {
    setEditingId(null);
    setAddrForm(emptyAddress());
  }

  async function saveAddress() {
    if (!canSaveAddr) return;
    setSavingAddr(true);
    const url = editingId ? `/api/users/addresses/${editingId}` : "/api/users/addresses";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(addrForm),
    });
    const data = await res.json().catch(() => ({}));
    setSavingAddr(false);
    if (!res.ok) {
      alert(data?.message || "Failed to save address");
      return;
    }
    resetAddrForm();
    await load();
  }

  async function deleteAddress(id) {
    if (!confirm("Delete this address?")) return;
    const res = await fetch(`/api/users/addresses/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) await load();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold tracking-widest">PROFILE</h1>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-white text-black font-bold"
        >
          Logout
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">User</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-white/60 mb-1">Name</div>
            <input className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">Phone</div>
            <input className={inputClass} value={editPhone} onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} />
          </div>
          <div className="md:col-span-2">
            <div className="text-xs text-white/60 mb-1">Email (immutable)</div>
            <input className={inputClass} value={user?.email || ""} readOnly disabled />
          </div>
        </div>
        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="mt-5 px-5 py-2 rounded-xl bg-white text-black font-extrabold disabled:opacity-50"
        >
          {savingProfile ? "Saving..." : "Edit Profile"}
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Saved Addresses</h2>
          <button
            onClick={resetAddrForm}
            className="px-4 py-2 rounded-xl border border-white/20 font-bold"
          >
            Add New Address
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="text-white/60">No saved addresses.</div>
        ) : (
          <div className="space-y-3 mb-8">
            {addresses.map((a) => (
              <div key={a._id} className="border border-white/10 rounded-xl p-4 bg-black/40">
                <div className="font-bold">{a.fullName}</div>
                <div className="text-white/70 text-sm">+91 {a.phone}</div>
                <div className="text-white/70 text-sm">
                  {[a.addressLine1, a.addressLine2, a.city, a.state, a.pincode, a.country].filter(Boolean).join(", ")}
                </div>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => startEditAddress(a)}
                    className="px-4 py-2 rounded-lg bg-white text-black font-bold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAddress(a._id)}
                    className="px-4 py-2 rounded-lg border border-white/20 font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-white/10 pt-6">
          <h3 className="font-bold mb-3">{editingId ? "Edit Address" : "Add Address"}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input className={inputClass} placeholder="Full Name" value={addrForm.fullName} onChange={(e) => setAddrForm((s) => ({ ...s, fullName: e.target.value }))} />
            <input className={inputClass} placeholder="Phone" value={addrForm.phone} onChange={(e) => setAddrForm((s) => ({ ...s, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} />
            <input className={inputClass} placeholder="Address Line 1" value={addrForm.addressLine1} onChange={(e) => setAddrForm((s) => ({ ...s, addressLine1: e.target.value }))} />
            <input className={inputClass} placeholder="Address Line 2" value={addrForm.addressLine2} onChange={(e) => setAddrForm((s) => ({ ...s, addressLine2: e.target.value }))} />
            <input className={inputClass} placeholder="City" value={addrForm.city} onChange={(e) => setAddrForm((s) => ({ ...s, city: e.target.value }))} />
            <input className={inputClass} placeholder="State" value={addrForm.state} onChange={(e) => setAddrForm((s) => ({ ...s, state: e.target.value }))} />
            <input className={inputClass} placeholder="Pincode" value={addrForm.pincode} onChange={(e) => setAddrForm((s) => ({ ...s, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} />
            <input className={inputClass} placeholder="Country" value={addrForm.country} onChange={(e) => setAddrForm((s) => ({ ...s, country: e.target.value }))} />
          </div>

          <button
            onClick={saveAddress}
            disabled={!canSaveAddr || savingAddr}
            className="mt-5 px-5 py-2 rounded-xl bg-white text-black font-extrabold disabled:opacity-50"
          >
            {savingAddr ? "Saving..." : "Save Address"}
          </button>
        </div>
      </div>
    </div>
  );
}

