"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Reusable Address Accordion Component
function AddressAccordion({ address }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!address) {
    return (
      <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-sm text-white/50 italic">No address available</p>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl bg-white/5 border border-white/10 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
      >
        <span className="text-sm font-semibold text-white/90">Customer Address</span>
        <span className="text-xs font-medium text-white/70 flex items-center gap-2">
          {isExpanded ? "Hide Address" : "View Address"}
          <span className={`transform transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
            ▼
          </span>
        </span>
      </button>
      
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 pt-2 space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/50 mb-1">Full Name</p>
              <p className="text-sm font-semibold text-white/90">
                {address.fullName || "N/A"}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-white/50 mb-1">Phone</p>
              <p className="text-sm font-semibold text-white/90">
                {address.phone || "N/A"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-white/50 mb-1">Address Line 1</p>
            <p className="text-sm font-semibold text-white/90">
              {address.addressLine1 || "N/A"}
            </p>
          </div>

          {address.addressLine2 && (
            <div>
              <p className="text-xs text-white/50 mb-1">Address Line 2</p>
              <p className="text-sm font-semibold text-white/90">
                {address.addressLine2}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/50 mb-1">City</p>
              <p className="text-sm font-semibold text-white/90">
                {address.city || "N/A"}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-white/50 mb-1">State</p>
              <p className="text-sm font-semibold text-white/90">
                {address.state || "N/A"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/50 mb-1">Pincode</p>
              <p className="text-sm font-semibold text-white/90">
                {address.pincode || "N/A"}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-white/50 mb-1">Country</p>
              <p className="text-sm font-semibold text-white/90">
                {address.country || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [creatingShipment, setCreatingShipment] = useState({});
  const [filterInfo, setFilterInfo] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const fetchOrders = async (page = 1, searchTerm = "", paymentStatus = "", orderStatus = "", sort = "createdAt", sortOrder = "desc") => {
    try {
      setLoading(true);
      
      // Get filter params from URL
      const userId = searchParams?.get("userId");
      const guestUserId = searchParams?.get("guestUserId");
      
      // Build query string
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sortBy: sort,
        order: sortOrder,
      });
      
      if (userId) params.append("userId", userId);
      if (guestUserId) params.append("guestUserId", guestUserId);
      if (searchTerm) params.append("search", searchTerm);
      if (paymentStatus) params.append("paymentStatus", paymentStatus);
      if (orderStatus) params.append("orderStatus", orderStatus);
      
      const url = `/api/admin/orders?${params.toString()}`;
      
      const res = await fetch(url, {
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (data.success) {
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setPagination(data.pagination || pagination);
        
        // Set filter info for display
        if (userId || guestUserId) {
          setFilterInfo({
            type: userId ? "user" : "guest",
            id: userId || guestUserId,
          });
        } else {
          setFilterInfo(null);
        }
      } else {
        setOrders([]);
        setPagination({ page: 1, limit: 10, total: 0, pages: 0 });
      }
    } catch (err) {
      setOrders([]);
      setPagination({ page: 1, limit: 10, total: 0, pages: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams) {
      fetchOrders(1, search, paymentStatusFilter, orderStatusFilter, sortBy, order);
    }
  }, [searchParams, search, paymentStatusFilter, orderStatusFilter, sortBy, order]);

  const handleSearch = () => {
    setSearch(searchInput);
    fetchOrders(1, searchInput, paymentStatusFilter, orderStatusFilter, sortBy, order);
  };

  function toggleOrder(id) {
    setExpandedOrderId(prev => (prev === id ? null : id));
  }

  const refreshOrders = async () => {
    await fetchOrders(pagination.page, search, paymentStatusFilter, orderStatusFilter, sortBy, order);
  };

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
        await refreshOrders();
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

  async function createShipment(orderId) {
    if (creatingShipment[orderId]) return;
    
    setCreatingShipment(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/create-shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      const data = await res.json();
      if (data.success) {
        await refreshOrders();
        alert(`Shipment created successfully!\nAWB: ${data.shipment?.waybill || "N/A"}\nCourier: ${data.shipment?.courierName || "N/A"}`);
      } else {
        // Extract error message with priority: error field > fallback
        const errorMessage = 
          data.error ||
          data.details?.rmk ||
          data.details?.message ||
          "Shipment creation failed";
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error creating shipment:", error);
      const errorMessage = 
        error?.message ||
        "An error occurred while creating shipment";
      alert(errorMessage);
    } finally {
      setCreatingShipment(prev => ({ ...prev, [orderId]: false }));
    }
  }

  // Orders are already sorted by API, no need for client-side sorting
  const sortedOrders = orders;

  /* ---------- ADDRESS FORMATTER ---------- */
  function formatAddress(address) {
    if (!address) return "";

    const parts = [];
    
    if (address.addressLine1) parts.push(address.addressLine1);
    if (address.addressLine2) parts.push(address.addressLine2);
    if (address.city) parts.push(address.city);
    
    // Format: State - Pincode (only if both exist, or individually if one is missing)
    if (address.state && address.pincode) {
      parts.push(`${address.state} - ${address.pincode}`);
    } else if (address.state) {
      parts.push(address.state);
    } else if (address.pincode) {
      parts.push(address.pincode);
    }
    
    if (address.country) parts.push(address.country);
    
    return parts.join(", ");
  }

  /* ---------- EXPORT CSV ---------- */
  function exportCSV() {
    if (orders.length === 0) return;

    // Format orders with address
    const formattedOrders = orders.map(order => ({
      OrderID: order._id,
      CustomerName: `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() || "N/A",
      Phone: order.customer?.phone || order.shippingAddress?.phone || "",
      Email: order.customer?.email || "",
      FullAddress: formatAddress(order.shippingAddress),
      PaymentMethod: order.paymentMethod || order.payment?.method || "N/A",
      OrderStatus: order.orderStatus || order.status || "N/A",
      PaymentStatus: order.paymentStatus || order.payment?.status || "N/A",
      TotalAmount: order.totalAmount || order.finalTotal || order.total || 0,
      CreatedAt: order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"
    }));

    const headers = [
      "Order ID",
      "Customer Name",
      "Phone",
      "Email",
      "Full Address",
      "Payment Method",
      "Order Status",
      "Payment Status",
      "Total Amount",
      "Created At",
    ];

    const rows = formattedOrders.map(o => [
      o.OrderID,
      o.CustomerName,
      o.Phone,
      o.Email,
      o.FullAddress,
      o.PaymentMethod,
      o.OrderStatus,
      o.PaymentStatus,
      o.TotalAmount,
      o.CreatedAt,
    ]);

    const csv =
      headers.join(",") +
      "\n" +
      rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

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
      <div className="mb-10">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-zinc-200 bg-clip-text text-transparent">
              Orders
            </h1>
            {filterInfo && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-white/60">
                  Filtered by {filterInfo.type === "user" ? "User" : "Guest User"}
                </span>
                <button
                  onClick={() => router.push("/admin/orders")}
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Order Count */}
            <span className="px-4 py-2 rounded-full bg-white/10 border border-white/15 font-bold">
              Total: {pagination.total || orders.length}
            </span>

            {/* Create Order */}
            <button
              onClick={() => router.push("/admin/orders/create")}
              className="px-5 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-extrabold hover:bg-white/15 hover:border-white/30 transition transform hover:scale-105"
            >
              + Create Order
            </button>

            {/* Export */}
            <button
              onClick={exportCSV}
              className="px-5 py-2 rounded-xl bg-white text-black font-extrabold hover:scale-105 transition"
            >
              Export
            </button>
          </div>
        </div>

        {/* Search and Filters Row */}
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by order number or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 py-2 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/50 focus:outline-none focus:border-white/30 transition"
              />
              <button
                onClick={handleSearch}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition transform hover:scale-105"
              >
                Search
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-white/30"
            >
              <option value="">All Payment Status</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
            </select>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-white/30"
            >
              <option value="">All Order Status</option>
              <option value="CREATED">CREATED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-white/30"
            >
              <option value="createdAt">Sort By</option>
              <option value="createdAt">Created Date</option>
              <option value="totalAmount">Total Amount</option>
            </select>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="px-4 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-white/30"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* ---------- LIST ---------- */}
      {sortedOrders.length === 0 ? (
        <div className="bg-white/10 border border-white/15 rounded-2xl p-12 text-center">
          No orders found.
        </div>
      ) : (
        <>
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

                    {/* Shipment Management */}
                    <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/30">
                      <p className="text-sm font-semibold text-blue-400 mb-3">Shipment Management</p>
                      
                      {order.isShipmentCreated ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                              Shipment Created
                            </span>
                          </div>
                          {order.delhiveryWaybill && (
                            <div className="grid md:grid-cols-2 gap-3 mt-3">
                              <div>
                                <p className="text-xs text-white/60">AWB Number</p>
                                <p className="font-mono text-sm font-bold text-white/90 break-all">
                                  {order.delhiveryWaybill}
                                </p>
                                {order.delhiveryTrackingUrl && (
                                  <a
                                    href={order.delhiveryTrackingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 underline mt-1 inline-block"
                                  >
                                    Track Shipment →
                                  </a>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-white/60">Courier</p>
                                <p className="text-sm font-semibold text-white/90">
                                  {order.delhiveryCourierName || order.delhiveryPartner || "N/A"}
                                </p>
                              </div>
                            </div>
                          )}
                          {order.delivery_status && (
                            <div className="mt-2">
                              <p className="text-xs text-white/60">Delivery Status</p>
                              <span className={`text-xs font-semibold ${
                                order.delivery_status === "DELIVERED" ? "text-green-400" :
                                order.delivery_status === "IN_TRANSIT" ? "text-blue-400" :
                                order.delivery_status === "SENT" ? "text-yellow-400" :
                                "text-white/70"
                              }`}>
                                {order.delivery_status}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {order.orderStatus === "CONFIRMED" ? (
                            <div>
                              <p className="text-xs text-white/60 mb-2">No shipment created yet</p>
                              <button
                                onClick={() => createShipment(order._id)}
                                disabled={creatingShipment[order._id]}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {creatingShipment[order._id] ? (
                                  <>
                                    <span className="animate-spin">⏳</span>
                                    Creating Shipment...
                                  </>
                                ) : (
                                  <>
                                    📦 Create Shipment
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-amber-400">
                                ⚠️ Order must be CONFIRMED to create shipment. Current status: {order.orderStatus}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {order.delhiveryError && !order.isShipmentCreated && (
                        <div className="mt-3 p-3 rounded-lg bg-red-900/20 border border-red-500/30">
                          <p className="text-xs text-red-400 font-semibold mb-1">Last Error</p>
                          <p className="text-xs text-white/70 break-all">
                            {typeof order.delhiveryError === 'string' 
                              ? order.delhiveryError 
                              : String(order.delhiveryError || "Unknown error")}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Customer Address Accordion */}
                    <AddressAccordion address={order.shippingAddress} />

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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-white/70">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchOrders(pagination.page - 1, search, paymentStatusFilter, orderStatusFilter, sortBy, order)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchOrders(pagination.page + 1, search, paymentStatusFilter, orderStatusFilter, sortBy, order)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
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
