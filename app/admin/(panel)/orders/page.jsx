"use client";

import { useEffect, useMemo, useState } from "react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [sortBy, setSortBy] = useState("latest");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/admin/orders", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  function toggleOrder(id) {
    setExpandedOrderId(prev => (prev === id ? null : id));
  }

  /* ---------- SORT ---------- */
  const sortedOrders = useMemo(() => {
    const arr = [...orders];
    if (sortBy === "latest")
      return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === "oldest")
      return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === "amount")
      return arr.sort((a, b) => b.total - a.total);
    return arr;
  }, [orders, sortBy]);

  /* ---------- EXPORT CSV ---------- */
  function exportCSV() {
    if (orders.length === 0) return;

    const headers = [
      "Order ID",
      "Name",
      "Phone",
      "Email",
      "Total",
      "Order Status",
      "Payment Status",
      "Payment Method",
      "Date",
    ];

    const rows = orders.map(o => [
      o._id,
      `${o.customer?.firstName || ""} ${o.customer?.lastName || ""}`,
      o.customer?.phone || "",
      o.customer?.email || "",
      o.total,
      o.orderStatus,
      o.payment?.status,
      o.payment?.method,
      new Date(o.createdAt).toLocaleString(),
    ]);

    const csv =
      headers.join(",") +
      "\n" +
      rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-10 text-white flex justify-center">
        <div className="bg-white/10 border border-white/15 rounded-2xl p-8 backdrop-blur-xl">
          Loading orders...
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 text-white">
      {/* ---------- HEADER ---------- */}
      <div className="flex flex-wrap justify-between items-center mb-10 gap-6">
        <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-zinc-200 bg-clip-text text-transparent">
          Orders
        </h1>

        <div className="flex items-center gap-4">
          {/* Order Count */}
          <span className="px-4 py-2 rounded-full bg-white/10 border border-white/15 font-bold">
            Total: {orders.length}
          </span>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-black/60 border border-white/15 rounded-xl px-4 py-2 text-white"
          >
            <option value="latest">Latest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount">Amount high → low</option>
            <option value="amount">Amount high → low</option>
            <option value="payment">Payment Status</option>
          </select>

          {/* Export */}
          <button
            onClick={exportCSV}
            className="px-5 py-2 rounded-xl bg-white text-black font-extrabold hover:scale-105 transition"
          >
            Export
          </button>
        </div>
      </div>

      {/* ---------- LIST ---------- */}
      {sortedOrders.length === 0 ? (
        <div className="bg-white/10 border border-white/15 rounded-2xl p-12 text-center">
          No orders found.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map(order => {
            const isOpen = expandedOrderId === order._id;

            return (
              <div
                key={order._id}
                className="bg-white/10 border border-white/15 rounded-2xl backdrop-blur-xl transition-all"
              >
                {/* COLLAPSED */}
                <button
                  onClick={() => toggleOrder(order._id)}
                  className="w-full p-5 flex justify-between items-center hover:bg-white/5 transition"
                >
<div className="grid grid-cols-2 sm:grid-cols-4 gap-x-16 gap-y-4">

                    <div>
                      <p className="text-xs text-white/50">Order ID</p>
                      <p className="font-semibold break-all">{order._id}</p>
                    </div>

                    <div>
                      <p className="text-xs text-white/50">Phone</p>
                      <p className="font-semibold">
                        {order.customer?.phone || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/50">Name</p>
                      <p className="font-semibold">
                        {order.customer?.firstName}{" "}
                        {order.customer?.lastName}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/50">Date</p>
                      <p className="font-semibold">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <span className="font-bold text-white/70">
                    {isOpen ? "▲ Hide" : "▼ View"}
                  </span>
                </button>

                {/* EXPANDED */}
                {isOpen && (
                  <div className="px-6 pb-6 pt-4 border-t border-white/10 animate-expand">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-white/60">Email</p>
                        <p className="font-semibold break-all">
                          {order.customer?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Status</p>
                        <p className="font-semibold capitalize">
                          {order.orderStatus}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-white/60">Payment</p>
                        <p className="font-semibold capitalize">
                          {order.payment?.status} (
                          {order.payment?.method || "N/A"})
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Total</p>
                        <p className="text-xl font-extrabold">
                          ₹{order.total}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* animation */}
      <style jsx global>{`
        .animate-expand {
          animation: expand 0.35s ease-out;
        }
        @keyframes expand {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
