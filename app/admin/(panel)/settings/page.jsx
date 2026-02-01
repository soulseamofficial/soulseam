"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    codAdvanceEnabled: true,
    codAdvanceAmount: 100,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        setError("Failed to load settings");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-white flex justify-center">
        <div className="bg-white/10 border border-white/15 rounded-2xl p-8 backdrop-blur-xl">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 text-white">
      <h1 className="text-4xl font-extrabold mb-10 bg-gradient-to-br from-white to-zinc-200 bg-clip-text text-transparent flex items-center gap-3">
        <Wallet className="w-10 h-10 text-white/90" />
        <span>COD Advance Settings</span>
      </h1>

      <div className="bg-white/10 border border-white/15 rounded-2xl p-8 backdrop-blur-xl max-w-2xl">
        {/* COD Advance Settings */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white/90">COD Advance Payment</h2>

          {/* Enable/Disable Toggle */}
          <div>
            <label className="flex items-center gap-4 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.codAdvanceEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, codAdvanceEnabled: e.target.checked })
                }
                className="w-5 h-5 rounded border-white/20 bg-black/40 text-orange-500 focus:ring-2 focus:ring-orange-500/50"
              />
              <span className="text-lg font-semibold text-white/90">
                Enable COD Advance Payment
              </span>
            </label>
            <p className="text-sm text-white/60 mt-2 ml-9">
              When enabled, customers must pay the COD advance amount before placing a Cash on Delivery order.
            </p>
          </div>

          {/* COD Advance Amount */}
          {settings.codAdvanceEnabled && (
            <div>
              <label className="block text-lg font-semibold text-white/90 mb-2">
                COD Advance Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.codAdvanceAmount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    codAdvanceAmount: Math.max(0, Number(e.target.value)),
                  })
                }
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                placeholder="100"
              />
              <p className="text-sm text-white/60 mt-2">
                The COD advance amount customers must pay before placing a Cash on Delivery order.
              </p>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-green-900/20 border border-green-500/30 text-green-400">
              {success}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-white
              bg-gradient-to-r from-orange-500 to-orange-600
              hover:from-orange-600 hover:to-orange-700
              transition-all duration-200
              shadow-lg hover:shadow-xl
              ${saving ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {saving ? "Saving..." : "Save COD Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
