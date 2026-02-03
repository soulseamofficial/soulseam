"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminReturnOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [sortBy, setSortBy] = useState("latest");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [returnCount, setReturnCount] = useState(0);

  useEffect(() => {
    async function fetchReturnOrders() {
      try {
        const res = await fetch("/api/admin/orders/returns", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
          setReturnCount(data.count || data.orders.length);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReturnOrders();
  }, []);

  function toggleOrder(id) {
    setExpandedOrderId(prev => (prev === id ? null : id));
  }

  async function updateReturnStatus(orderId, newStatus, refundStatus = null) {
    if (updatingStatus[orderId]) return;
    
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/return-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          returnStatus: newStatus,
          refundStatus: refundStatus 
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        // Refresh orders
        const refreshRes = await fetch("/api/admin/orders/returns", {
          credentials: "include",
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setOrders(refreshData.orders);
          setReturnCount(refreshData.count || refreshData.orders.length);
        }
        alert(`Return status updated to ${newStatus}`);
      } else {
        alert(data.error || "Failed to update return status");
      }
    } catch (error) {
      console.error("Error updating return status:", error);
      alert("An error occurred while updating return status");
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  }

  // Get status badge color
  function getStatusBadgeColor(status) {
    switch (status) {
      case "REQUESTED":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "APPROVED":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "PICKUP_SCHEDULED":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "COMPLETED":
        return "bg-green-500/20 text-green-300 border-green-500/40";
      case "REJECTED":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      default:
        return "bg-white/10 text-white/70 border-white/20";
    }
  }

  // Get refund status badge color
  function getRefundStatusBadgeColor(status) {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "PROCESSING":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "COMPLETED":
        return "bg-green-500/20 text-green-300 border-green-500/40";
      case "FAILED":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      default:
        return "bg-white/10 text-white/70 border-white/20";
    }
  }

  /* ---------- FILTER & SORT ---------- */
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(order => order.returnStatus === filterStatus);
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
      filtered.sort((a, b) => new Date(b.returnRequestedAt || b.createdAt) - new Date(a.returnRequestedAt || a.createdAt));
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.returnRequestedAt || a.createdAt) - new Date(b.returnRequestedAt || b.createdAt));
    } else if (sortBy === "status") {
      filtered.sort((a, b) => {
        const statusOrder = { REQUESTED: 1, APPROVED: 2, PICKUP_SCHEDULED: 3, COMPLETED: 4, REJECTED: 5 };
        return (statusOrder[a.returnStatus] || 99) - (statusOrder[b.returnStatus] || 99);
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
      "Return Requested Date",
      "Return Status",
      "Payment Method",
      "Refund Status",
      "Total Amount",
    ];

    const rows = filteredAndSortedOrders.map(o => [
      o._id,
      `${o.customer?.firstName || ""} ${o.customer?.lastName || ""}`,
      o.customer?.email || "",
      o.customer?.phone || "",
      o.items?.map(i => i.name).join("; ") || "",
      o.deliveredAt ? new Date(o.deliveredAt).toLocaleDateString() : "N/A",
      o.returnRequestedAt ? new Date(o.returnRequestedAt).toLocaleDateString() : "N/A",
      o.returnStatus || "N/A",
      o.paymentMethod || "N/A",
      o.refundStatus || "N/A",
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
    a.download = `return_orders_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-10 text-white flex justify-center">
        <div className="bg-white/10 border border-white/15 rounded-2xl p-8 backdrop-blur-xl">
          Loading return orders...
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
            Return Orders
          </h1>
          <p className="text-white/60 text-sm">Manage all return requests and their status</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Return Orders Count Badge */}
          <span className="px-4 py-2 rounded-full bg-white/10 border border-white/15 font-bold">
            Total: {returnCount}
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
            <option value="PICKUP_SCHEDULED">PICKUP_SCHEDULED</option>
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
            ? "No return orders found matching your filters." 
            : "No return orders found."}
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

                    {/* Return Requested Date */}
                    <div>
                      <p className="text-xs text-white/50">Return Requested</p>
                      <p className="font-semibold text-sm">
                        {order.returnRequestedAt 
                          ? new Date(order.returnRequestedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>

                    {/* Return Status Badge */}
                    <div>
                      <p className="text-xs text-white/50 mb-1">Return Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(order.returnStatus)}`}>
                        {order.returnStatus || "N/A"}
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

                      {/* Order & Return Info */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold text-white/90 mb-3">Return Information</h3>
                        <div>
                          <p className="text-sm text-white/60">Return Status</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getStatusBadgeColor(order.returnStatus)}`}>
                              {order.returnStatus || "N/A"}
                            </span>
                            {order.returnStatus && (
                              <select
                                value={order.returnStatus}
                                onChange={(e) => updateReturnStatus(order._id, e.target.value)}
                                disabled={updatingStatus[order._id]}
                                className="ml-2 bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/40 disabled:opacity-50"
                              >
                                <option value="REQUESTED">REQUESTED</option>
                                <option value="APPROVED">APPROVED</option>
                                <option value="PICKUP_SCHEDULED">PICKUP_SCHEDULED</option>
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
                          <p className="text-sm text-white/60">Return Requested At</p>
                          <p className="font-semibold">
                            {order.returnRequestedAt 
                              ? new Date(order.returnRequestedAt).toLocaleString("en-IN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </p>
                        </div>
                        {order.returnApprovedAt && (
                          <div>
                            <p className="text-sm text-white/60">Return Approved At</p>
                            <p className="font-semibold">
                              {new Date(order.returnApprovedAt).toLocaleString("en-IN", {
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

                    {/* Return Reason & Video */}
                    {(order.returnReason || order.returnVideoUrl) && (
                      <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                        <h3 className="text-lg font-bold text-white/90 mb-3">Return Details</h3>
                        {order.returnReason && (
                          <div className="mb-4">
                            <p className="text-sm text-white/60 mb-1">Reason for Return</p>
                            <p className="font-semibold text-white/90">{order.returnReason}</p>
                          </div>
                        )}
                        {order.returnVideoUrl && (
                          <div>
                            <p className="text-sm text-white/60 mb-2">Return Video</p>
                            <div className="rounded-lg overflow-hidden border border-white/20">
                              <video
                                src={order.returnVideoUrl}
                                controls
                                className="w-full max-h-96"
                                preload="metadata"
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                            <a
                              href={order.returnVideoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300 underline"
                            >
                              Open video in new tab
                            </a>
                          </div>
                        )}
                      </div>
                    )}

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

                    {/* Payment & Refund Info */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
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

                      <div>
                        <h3 className="text-lg font-bold text-white/90 mb-3">Refund Information</h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-white/60">Refund Status</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getRefundStatusBadgeColor(order.refundStatus)}`}>
                                {order.refundStatus || "N/A"}
                              </span>
                              {order.returnStatus === "COMPLETED" && (
                                <select
                                  value={order.refundStatus || "PENDING"}
                                  onChange={(e) => updateReturnStatus(order._id, order.returnStatus, e.target.value)}
                                  disabled={updatingStatus[order._id]}
                                  className="ml-2 bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/40 disabled:opacity-50"
                                >
                                  <option value="PENDING">PENDING</option>
                                  <option value="PROCESSING">PROCESSING</option>
                                  <option value="COMPLETED">COMPLETED</option>
                                  <option value="FAILED">FAILED</option>
                                </select>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-lg font-bold text-white/90 mb-3">Admin Actions</h3>
                      {order.returnStatus === "REQUESTED" && !order.returnVideoUrl && (
                        <div className="mb-3 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                          <p className="text-sm text-yellow-300 font-semibold">
                            ⚠️ Warning: No return video uploaded. Please verify the return request carefully.
                          </p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {order.returnStatus === "REQUESTED" && (
                          <>
                            <button
                              onClick={() => updateReturnStatus(order._id, "APPROVED")}
                              disabled={updatingStatus[order._id]}
                              className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Accept Return
                            </button>
                            <button
                              onClick={() => updateReturnStatus(order._id, "REJECTED")}
                              disabled={updatingStatus[order._id]}
                              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Reject Return
                            </button>
                          </>
                        )}
                        {order.returnStatus === "APPROVED" && (
                          <button
                            onClick={() => updateReturnStatus(order._id, "PICKUP_SCHEDULED")}
                            disabled={updatingStatus[order._id]}
                            className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Schedule Pickup
                          </button>
                        )}
                        {order.returnStatus === "PICKUP_SCHEDULED" && (
                          <button
                            onClick={() => updateReturnStatus(order._id, "COMPLETED")}
                            disabled={updatingStatus[order._id]}
                            className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Mark Pickup Completed
                          </button>
                        )}
                        {order.returnStatus === "COMPLETED" && (
                          <button
                            onClick={() => router.push(`/admin/orders?orderId=${order._id}`)}
                            className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 font-semibold transition"
                          >
                            View / Process Refund
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
