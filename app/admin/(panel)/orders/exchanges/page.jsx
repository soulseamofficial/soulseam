"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminExchangeOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [sortBy, setSortBy] = useState("latest");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [exchangeCount, setExchangeCount] = useState(0);

  useEffect(() => {
    async function fetchExchangeOrders() {
      try {
        const res = await fetch("/api/admin/orders/exchanges", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
          setExchangeCount(data.count || data.orders.length);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchExchangeOrders();
  }, []);

  function toggleOrder(id) {
    setExpandedOrderId(prev => (prev === id ? null : id));
  }

  async function updateExchangeStatus(orderId, newStatus) {
    if (updatingStatus[orderId]) return;
    
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/exchange-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          exchangeStatus: newStatus,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        // Refresh orders
        const refreshRes = await fetch("/api/admin/orders/exchanges", {
          credentials: "include",
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setOrders(refreshData.orders);
          setExchangeCount(refreshData.count || refreshData.orders.length);
        }
        alert(`Exchange status updated to ${newStatus}`);
      } else {
        alert(data.error || "Failed to update exchange status");
      }
    } catch (error) {
      console.error("Error updating exchange status:", error);
      alert("An error occurred while updating exchange status");
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  }

  // Get status badge color (matching user profile page)
  function getStatusBadgeColor(status) {
    switch (status) {
      case "REQUESTED":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "APPROVED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "COMPLETED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "REJECTED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-white/10 text-white/70 border-white/20";
    }
  }

  // Get exchange type label
  function getExchangeTypeLabel(type) {
    switch (type) {
      case "SIZE":
        return "Size Change";
      case "COLOR":
        return "Color Change";
      case "DEFECT":
        return "Defective Product";
      case "WRONG_ITEM":
        return "Wrong Item Received";
      default:
        return type || "N/A";
    }
  }

  /* ---------- FILTER & SORT ---------- */
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(order => order.exchangeStatus === filterStatus);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const orderId = order._id.toLowerCase();
        const customerName = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.toLowerCase();
        const customerEmail = (order.customer?.email || "").toLowerCase();
        const customerPhone = (order.customer?.phone || "").toLowerCase();
        return orderId.includes(query) || 
               customerName.includes(query) || 
               customerEmail.includes(query) ||
               customerPhone.includes(query);
      });
    }

    // Sort
    if (sortBy === "latest") {
      filtered.sort((a, b) => new Date(b.exchangeRequestedAt || b.createdAt) - new Date(a.exchangeRequestedAt || a.createdAt));
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.exchangeRequestedAt || a.createdAt) - new Date(b.exchangeRequestedAt || b.createdAt));
    } else if (sortBy === "status") {
      filtered.sort((a, b) => {
        const statusOrder = { REQUESTED: 1, APPROVED: 2, COMPLETED: 3, REJECTED: 4 };
        return (statusOrder[a.exchangeStatus] || 99) - (statusOrder[b.exchangeStatus] || 99);
      });
    }

    return filtered;
  }, [orders, filterStatus, searchQuery, sortBy]);

  /* ---------- EXPORT CSV ---------- */
  function exportCSV() {
    if (filteredAndSortedOrders.length === 0) return;

    const headers = [
      "Order ID",
      "Customer Name",
      "Email",
      "Phone",
      "Products",
      "Delivered Date",
      "Exchange Requested Date",
      "Exchange Type",
      "Exchange Status",
      "Payment Method",
      "Total Amount",
    ];

    const rows = filteredAndSortedOrders.map(o => [
      o._id,
      `${o.customer?.firstName || ""} ${o.customer?.lastName || ""}`,
      o.customer?.email || "",
      o.customer?.phone || "",
      o.items?.map(i => i.name).join("; ") || "",
      o.deliveredAt ? new Date(o.deliveredAt).toLocaleDateString() : "N/A",
      o.exchangeRequestedAt ? new Date(o.exchangeRequestedAt).toLocaleDateString() : "N/A",
      getExchangeTypeLabel(o.exchangeType),
      o.exchangeStatus || "N/A",
      o.paymentMethod || "N/A",
      o.totalAmount || o.finalTotal || o.total || 0,
    ]);

    const csv =
      headers.join(",") +
      "\n" +
      rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `exchange_orders_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-10 text-white flex justify-center">
        <div className="bg-white/10 border border-white/15 rounded-2xl p-8 backdrop-blur-xl">
          Loading exchange orders...
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 text-white">
      {/* ---------- HEADER ---------- */}
      <div className="flex flex-wrap justify-between items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-zinc-200 bg-clip-text text-transparent mb-2">
            Exchange Orders
          </h1>
          <p className="text-white/60 text-sm">Manage all exchange requests and their status</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Exchange Orders Count Badge */}
          <span className="px-4 py-2 rounded-full bg-white/10 border border-white/15 font-bold">
            Total: {exchangeCount}
          </span>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by Order ID or Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-black/60 border border-white/15 rounded-xl px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 min-w-[200px]"
          />

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-black/60 border border-white/15 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white/40"
          >
            <option value="all">All Status</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-black/60 border border-white/15 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white/40"
          >
            <option value="latest">Latest first</option>
            <option value="oldest">Oldest first</option>
            <option value="status">By Status</option>
          </select>

          {/* Export */}
          <button
            onClick={exportCSV}
            className="px-5 py-2 rounded-xl bg-white text-black font-extrabold hover:scale-105 transition"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* ---------- LIST ---------- */}
      {filteredAndSortedOrders.length === 0 ? (
        <div className="bg-white/10 border border-white/15 rounded-2xl p-12 text-center">
          {searchQuery || filterStatus !== "all" 
            ? "No exchange orders found matching your filters." 
            : "No exchange orders found."}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedOrders.map(order => {
            const isOpen = expandedOrderId === order._id;
            const customerName = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() || "N/A";

            return (
              <div
                key={order._id}
                className="bg-white/10 border border-white/15 rounded-2xl backdrop-blur-xl transition-all"
              >
                {/* COLLAPSED ROW */}
                <button
                  onClick={() => toggleOrder(order._id)}
                  className="w-full p-5 flex justify-between items-center hover:bg-white/5 transition"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-x-6 gap-y-4 flex-1">
                    {/* Order ID */}
                    <div>
                      <p className="text-xs text-white/50">Order ID</p>
                      <p className="font-semibold break-all text-xs">{order._id.slice(-8)}</p>
                    </div>

                    {/* Customer Name */}
                    <div>
                      <p className="text-xs text-white/50">Customer</p>
                      <p className="font-semibold text-sm">{customerName}</p>
                      <p className="text-xs text-white/60">{order.customer?.phone || "N/A"}</p>
                    </div>

                    {/* Products */}
                    <div>
                      <p className="text-xs text-white/50">Products</p>
                      <p className="font-semibold text-sm">
                        {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                      </p>
                      {order.items?.length > 0 && (
                        <p className="text-xs text-white/60 truncate max-w-[150px]">
                          {order.items[0].name}
                          {order.items.length > 1 && ` +${order.items.length - 1} more`}
                        </p>
                      )}
                    </div>

                    {/* Delivered Date */}
                    <div>
                      <p className="text-xs text-white/50">Delivered</p>
                      <p className="font-semibold text-sm">
                        {order.deliveredAt 
                          ? new Date(order.deliveredAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>

                    {/* Exchange Requested Date */}
                    <div>
                      <p className="text-xs text-white/50">Exchange Requested</p>
                      <p className="font-semibold text-sm">
                        {order.exchangeRequestedAt 
                          ? new Date(order.exchangeRequestedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>

                    {/* Exchange Status Badge */}
                    <div>
                      <p className="text-xs text-white/50 mb-1">Exchange Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(order.exchangeStatus)}`}>
                        {order.exchangeStatus || "N/A"}
                      </span>
                    </div>
                  </div>

                  <span className="font-bold text-white/70 ml-4">
                    {isOpen ? "▲ Hide" : "▼ View"}
                  </span>
                </button>

                {/* EXPANDED DETAILS */}
                {isOpen && (
                  <div className="px-6 pb-6 pt-4 border-t border-white/10 animate-expand">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      {/* Customer Info */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold text-white/90 mb-3">Customer Information</h3>
                        <div>
                          <p className="text-sm text-white/60">Name</p>
                          <p className="font-semibold">{customerName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60">Email</p>
                          <p className="font-semibold break-all">{order.customer?.email || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60">Phone</p>
                          <p className="font-semibold">{order.customer?.phone || "N/A"}</p>
                        </div>
                      </div>

                      {/* Exchange Info */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold text-white/90 mb-3">Exchange Information</h3>
                        <div>
                          <p className="text-sm text-white/60">Exchange Status</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getStatusBadgeColor(order.exchangeStatus)}`}>
                              {order.exchangeStatus || "N/A"}
                            </span>
                            {order.exchangeStatus && (
                              <select
                                value={order.exchangeStatus}
                                onChange={(e) => updateExchangeStatus(order._id, e.target.value)}
                                disabled={updatingStatus[order._id]}
                                className="ml-2 bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/40 disabled:opacity-50"
                              >
                                <option value="REQUESTED">REQUESTED</option>
                                <option value="APPROVED">APPROVED</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="REJECTED">REJECTED</option>
                              </select>
                            )}
                            {updatingStatus[order._id] && (
                              <span className="text-xs text-white/60">Updating...</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-white/60">Exchange Type</p>
                          <p className="font-semibold">{getExchangeTypeLabel(order.exchangeType)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60">Exchange Requested At</p>
                          <p className="font-semibold">
                            {order.exchangeRequestedAt 
                              ? new Date(order.exchangeRequestedAt).toLocaleString("en-IN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </p>
                        </div>
                        {order.exchangeApprovedAt && (
                          <div>
                            <p className="text-sm text-white/60">Exchange Approved At</p>
                            <p className="font-semibold">
                              {new Date(order.exchangeApprovedAt).toLocaleString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        )}
                        {order.exchangeCompletedAt && (
                          <div>
                            <p className="text-sm text-white/60">Exchange Completed At</p>
                            <p className="font-semibold">
                              {new Date(order.exchangeCompletedAt).toLocaleString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-white/60">Delivered Date</p>
                          <p className="font-semibold">
                            {order.deliveredAt 
                              ? new Date(order.deliveredAt).toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Exchange Reason & Video */}
                    <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-lg font-bold text-white/90 mb-3">Exchange Details</h3>
                      {order.exchangeReason && (
                        <div className="mb-4">
                          <p className="text-sm text-white/60 mb-1">Reason for Exchange</p>
                          <p className="font-semibold text-white/90">{order.exchangeReason}</p>
                        </div>
                      )}
                      {order.exchangeVideo?.url ? (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-bold text-white/90">Exchange Video</p>
                            <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/40">
                              ✓ Video Uploaded
                            </span>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 mb-2 border border-white/10">
                            <p className="text-xs text-white/60 mb-2">
                              <strong>Policy Requirement:</strong> Video proof is mandatory for all exchange requests. Please review this video carefully before approving or rejecting the exchange request.
                            </p>
                          </div>
                          <div className="rounded-lg overflow-hidden border border-white/20">
                            <video
                              src={order.exchangeVideo.url}
                              controls
                              className="w-full max-h-96"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          <a
                            href={order.exchangeVideo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300 underline"
                          >
                            Open video in new tab
                          </a>
                          {order.exchangeVideo.uploadedAt && (
                            <p className="text-xs text-white/50 mt-2">
                              Uploaded: {new Date(order.exchangeVideo.uploadedAt).toLocaleString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <p className="text-xs text-white/60 leading-relaxed">
                            No video uploaded. Video upload is optional but helps process exchanges faster.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Products List */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white/90 mb-3">Products</h3>
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-sm text-white/60">
                                {item.color && `${item.color} / `}{item.size} × {item.quantity}
                              </p>
                              <p className="text-sm font-semibold mt-1">
                                ₹{(item.price || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white/90 mb-3">Payment Information</h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-white/60">Payment Method</p>
                          <p className="font-semibold capitalize">{order.paymentMethod || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60">Payment Status</p>
                          <p className="font-semibold capitalize">{order.paymentStatus || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60">Total Amount</p>
                          <p className="text-xl font-extrabold">
                            ₹{(order.totalAmount || order.finalTotal || order.total || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-lg font-bold text-white/90 mb-3">Admin Actions</h3>
                      {order.exchangeStatus === "REQUESTED" && order.exchangeVideo?.url && (
                        <div className="mb-3 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <p className="text-sm text-blue-300 font-semibold">
                            ✓ Video uploaded. Please review the video above before approving or rejecting this exchange request.
                          </p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {order.exchangeStatus === "REQUESTED" && (
                          <>
                            <button
                              onClick={() => {
                                if (order.exchangeVideo?.url) {
                                  if (confirm("Have you reviewed the uploaded video? Please confirm that you have reviewed the video before approving this exchange request.")) {
                                    updateExchangeStatus(order._id, "APPROVED");
                                  }
                                } else {
                                  if (confirm("Are you sure you want to approve this exchange request?")) {
                                    updateExchangeStatus(order._id, "APPROVED");
                                  }
                                }
                              }}
                              disabled={updatingStatus[order._id]}
                              className="px-4 py-2 rounded-lg border font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30"
                            >
                              Approve Exchange
                            </button>
                            <button
                              onClick={() => updateExchangeStatus(order._id, "REJECTED")}
                              disabled={updatingStatus[order._id]}
                              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Reject Exchange
                            </button>
                          </>
                        )}
                        {order.exchangeStatus === "APPROVED" && (
                          <button
                            onClick={() => updateExchangeStatus(order._id, "COMPLETED")}
                            disabled={updatingStatus[order._id]}
                            className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Mark Exchange Completed
                          </button>
                        )}
                        {order.exchangeStatus === "COMPLETED" && (
                          <button
                            onClick={() => router.push(`/admin/orders?orderId=${order._id}`)}
                            className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 font-semibold transition"
                          >
                            View Order Details
                          </button>
                        )}
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
