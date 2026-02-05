"use client";

import { useEffect, useMemo, useState } from "react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [sortBy, setSortBy] = useState("latest");
  const [updatingStatus, setUpdatingStatus] = useState({});

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

  async function updateOrderStatus(orderId, newStatus) {
    if (updatingStatus[orderId]) return;
    
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      
      const data = await res.json();
      if (data.success) {
        // Refresh orders
        const refreshRes = await fetch("/api/admin/orders", {
          credentials: "include",
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setOrders(refreshData.orders);
        }
        alert(`Order status updated to ${newStatus}`);
      } else {
        alert(data.error || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("An error occurred while updating order status");
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
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
      "Payment Method",
      "Advance Paid",
      "Remaining COD",
      "Final Total",
      "Order Status",
      "Payment Status",
      "Date",
    ];

    const rows = orders.map(o => [
      o._id,
      `${o.customer?.firstName || ""} ${o.customer?.lastName || ""}`,
      o.customer?.phone || "",
      o.customer?.email || "",
      o.paymentMethod || o.payment?.method || "N/A",
      o.paymentMethod === "COD" ? (o.advancePaid || 0) : (o.paymentStatus === "PAID" ? (o.totalAmount || o.total || 0) : 0),
      o.paymentMethod === "COD" ? (o.remainingCOD || (o.totalAmount || o.total || 0)) : 0,
      o.totalAmount || o.finalTotal || o.total || 0,
      o.orderStatus,
      o.paymentStatus || o.payment?.status || "N/A",
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
                className="border border-white/10 rounded-2xl p-5 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-black/50 hover:shadow-[0_8px_24px_rgba(255,255,255,0.08)]"
              >
                {/* COLLAPSED */}
                <button
                  onClick={() => toggleOrder(order._id)}
                  className="w-full p-5 flex justify-between items-center hover:bg-white/5 transition"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-x-8 gap-y-4 flex-1">
                    <div>
                      <p className="text-xs text-white/50">Order ID</p>
                      <p className="font-semibold break-all text-xs">{order._id.slice(-8)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-white/50">Customer</p>
                      <p className="font-semibold text-sm">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </p>
                      <p className="text-xs text-white/60">
                        {order.customer?.phone || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/50">Payment</p>
                      <p className="font-semibold capitalize text-sm">
                        {order.paymentMethod || order.payment?.method || "N/A"}
                      </p>
                      {order.paymentMethod === "COD" && order.advancePaid > 0 && (
                        <p className="text-xs text-amber-400">
                          Advance: ₹{order.advancePaid}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-white/50">Total</p>
                      <p className="font-semibold">
                        ₹{order.totalAmount || order.finalTotal || order.total || 0}
                      </p>
                      {order.paymentMethod === "COD" && order.remainingCOD > 0 && (
                        <p className="text-xs text-white/60">
                          Remaining: ₹{order.remainingCOD}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-white/50 mb-1">Status</p>
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        (order.orderStatus || "CREATED") === "DELIVERED" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                        (order.orderStatus || "CREATED") === "SHIPPED" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                        (order.orderStatus || "CREATED") === "CONFIRMED" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                        (order.orderStatus || "CREATED") === "CANCELLED" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        (order.orderStatus || "CREATED") === "PENDING" || (order.orderStatus || "CREATED") === "CREATED" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        "bg-white/10 text-white/70 border-white/20"
                      }`}>
                        {order.orderStatus || "CREATED"}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-white/50 mb-1">Payment</p>
                      <span className={`text-xs font-semibold ${
                        (order.paymentStatus || "PENDING") === "PAID" ? "text-green-400" :
                        (order.paymentStatus || "PENDING") === "FAILED" ? "text-red-400" :
                        (order.paymentStatus || "PENDING") === "PENDING" ? "text-yellow-400" :
                        "text-yellow-400"
                      }`}>
                        {order.paymentStatus || "PENDING"}
                      </span>
                    </div>
                  </div>

                  <span className="font-bold text-white/70 ml-4">
                    {isOpen ? "▲ Hide" : "▼ View"}
                  </span>
                </button>

                {/* EXPANDED */}
                {isOpen && (
                  <div className="pt-4 mt-4 border-t border-white/10 animate-expand">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-white/60">Email</p>
                        <p className="font-semibold break-all">
                          {order.customer?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-white/60 mb-2">Status</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${
                            (order.orderStatus || "CREATED") === "DELIVERED" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                            (order.orderStatus || "CREATED") === "SHIPPED" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                            (order.orderStatus || "CREATED") === "CONFIRMED" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                            (order.orderStatus || "CREATED") === "CANCELLED" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                            (order.orderStatus || "CREATED") === "PENDING" || (order.orderStatus || "CREATED") === "CREATED" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                            "bg-white/10 text-white/70 border-white/20"
                          }`}>
                            {order.orderStatus || "CREATED"}
                          </span>
                          <select
                            value={order.orderStatus}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            disabled={updatingStatus[order._id]}
                            className="bg-black/60 border border-white/15 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-white/40 disabled:opacity-50"
                          >
                            <option value="CREATED">CREATED</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                          {updatingStatus[order._id] && (
                            <span className="text-xs text-white/60">Updating...</span>
                          )}
                        </div>
                        {order.deliveredAt && (
                          <p className="text-xs text-white/50 mt-2">
                            Delivered: {new Date(order.deliveredAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-white/60">Payment Method</p>
                        <p className="font-semibold capitalize">
                          {order.paymentMethod || order.payment?.method || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-white/60 mb-2">Payment Status</p>
                        <p className={`font-semibold capitalize ${
                          (order.paymentStatus || "PENDING") === "PAID" ? "text-green-400" :
                          (order.paymentStatus || "PENDING") === "FAILED" ? "text-red-400" :
                          (order.paymentStatus || "PENDING") === "PENDING" ? "text-yellow-400" :
                          "text-yellow-400"
                        }`}>
                          {order.paymentStatus || order.payment?.status || "PENDING"}
                        </p>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-white/60">Subtotal</p>
                        <p className="font-semibold">
                          ₹{order.subtotal || order.total || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Discount</p>
                        <p className="font-semibold">
                          ₹{order.discount || order.discountAmount || 0}
                        </p>
                      </div>
                    </div>

                    {/* COD Advance Payment Details */}
                    {order.paymentMethod === "COD" && (
                      <div className="mb-4 p-4 rounded-xl bg-amber-900/20 border border-amber-500/30">
                        <p className="text-sm font-semibold text-amber-400 mb-2">COD Payment Details</p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-white/60">Advance Paid</p>
                            <p className="font-bold text-amber-400">
                              ₹{order.advancePaid || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/60">Remaining COD</p>
                            <p className="font-bold text-white">
                              ₹{order.remainingCOD || (order.totalAmount || order.total || 0)}
                            </p>
                          </div>
                        </div>
                        {order.razorpayPaymentId && (
                          <div className="mt-2">
                            <p className="text-xs text-white/60">Razorpay Payment ID</p>
                            <p className="font-mono text-xs text-white/80 break-all">
                              {order.razorpayPaymentId}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-white/60">Final Total</p>
                        <p className="text-xl font-extrabold">
                          ₹{order.totalAmount || order.finalTotal || order.total || 0}
                        </p>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="mb-4">
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

                    {/* Customer Message */}
                    {order.orderMessage && (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-pink-900/20 to-purple-900/20 border border-pink-500/30">
                        <p className="text-sm font-semibold text-pink-400 mb-2">Customer Message</p>
                        <div className="p-3 rounded-lg bg-black/30 border border-pink-400/20">
                          <p className="text-sm text-white/90 italic whitespace-pre-wrap">
                            &quot;{order.orderMessage}&quot;
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Exchange Information */}
                    {order.exchangeRequested && (
                      <div className="mt-4 p-4 rounded-xl bg-blue-900/20 border border-blue-500/30">
                        <p className="text-sm font-semibold text-blue-400 mb-2">Exchange Information</p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-white/60">Exchange Status</p>
                            <p className="font-bold text-blue-400">
                              {order.exchangeStatus || "REQUESTED"}
                            </p>
                          </div>
                          {order.exchangeRequestedAt && (
                            <div>
                              <p className="text-xs text-white/60">Requested At</p>
                              <p className="font-semibold text-white/80">
                                {new Date(order.exchangeRequestedAt).toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
