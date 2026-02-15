"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletedOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchDeletedOrders = async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders/deleted?page=${page}&limit=10`, {
        credentials: "include",
      });
      const data = await res.json();
      
      if (data.success) {
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setPagination(data.pagination || pagination);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedOrders(1);
  }, []);

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o._id));
    }
  };

  const handleRestore = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/orders/bulk-restore", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderIds: selectedOrders }),
      });

      const data = await res.json();
      
      if (data.success) {
        setToast({
          message: `Successfully restored ${data.restoredCount} order(s)`,
          type: "success",
        });
        setShowRestoreModal(false);
        setSelectedOrders([]);
        await fetchDeletedOrders(pagination.page);
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({
          message: data.error || "Failed to restore orders",
          type: "error",
        });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Error restoring orders:", error);
      setToast({
        message: "An error occurred while restoring orders",
        type: "error",
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (deleteConfirmText !== "DELETE PERMANENTLY") {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/admin/orders/bulk-permanent-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderIds: selectedOrders }),
      });

      const data = await res.json();
      
      if (data.success) {
        setToast({
          message: `Permanently deleted ${data.deletedCount} order(s)`,
          type: "success",
        });
        setShowDeleteModal(false);
        setDeleteConfirmText("");
        setSelectedOrders([]);
        await fetchDeletedOrders(pagination.page);
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({
          message: data.error || "Failed to delete orders",
          type: "error",
        });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting orders:", error);
      setToast({
        message: "An error occurred while deleting orders",
        type: "error",
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-white flex justify-center">
        <div className="bg-white/10 border border-white/15 rounded-2xl p-8 backdrop-blur-xl">
          Loading deleted orders...
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 text-white">
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-zinc-200 bg-clip-text text-transparent">
              Deleted Orders
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Manage and restore deleted orders
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-4 py-2 rounded-full bg-white/10 border border-white/15 font-bold">
              Total: {pagination.total || orders.length}
            </span>
            <button
              onClick={() => router.push("/admin/orders")}
              className="px-5 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-extrabold hover:bg-white/15 hover:border-white/30 transition transform hover:scale-105"
            >
              ← Back to Orders
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {selectedOrders.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 font-bold text-white">
              {selectedOrders.length} Selected
            </span>
            <button
              onClick={() => setShowRestoreModal(true)}
              className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold transition transform hover:scale-105"
            >
              Restore Orders
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold transition transform hover:scale-105"
            >
              Delete Permanently
            </button>
            <button
              onClick={() => setSelectedOrders([])}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white/10 border border-white/15 rounded-2xl p-12 text-center">
          No deleted orders found.
        </div>
      ) : (
        <>
          {/* Select All */}
          <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedOrders.length === orders.length && orders.length > 0}
              onChange={handleSelectAll}
              className="w-5 h-5 rounded border-white/30 bg-black cursor-pointer"
            />
            <span className="text-sm font-semibold text-white/70">Select All</span>
          </div>

          <div className="space-y-4">
            {orders.map(order => (
              <div
                key={order._id}
                className="border border-white/10 rounded-2xl p-5 bg-black/40 backdrop-blur-sm"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order._id)}
                    onChange={() => handleSelectOrder(order._id)}
                    className="w-5 h-5 rounded border-white/30 bg-black cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-white/50">Order ID</p>
                      <p className="font-semibold break-all text-xs">{order._id.slice(-8)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50">Customer</p>
                      <p className="font-semibold text-sm">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50">Total</p>
                      <p className="font-semibold">
                        ₹{order.totalAmount || order.finalTotal || order.total || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50">Status</p>
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        (order.orderStatus || "CREATED") === "DELIVERED" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                        (order.orderStatus || "CREATED") === "SHIPPED" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                        (order.orderStatus || "CREATED") === "CONFIRMED" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                        "bg-white/10 text-white/70 border-white/20"
                      }`}>
                        {order.orderStatus || "CREATED"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-white/50">Deleted At</p>
                      <p className="font-semibold text-sm">
                        {order.deletedAt ? new Date(order.deletedAt).toLocaleString() : "N/A"}
                      </p>
                      {order.deletedBy && (
                        <p className="text-xs text-white/60 mt-1">
                          By: {order.deletedBy.email || order.deletedBy.name || "Admin"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-white/70">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchDeletedOrders(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchDeletedOrders(pagination.page + 1)}
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

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-green-900/95 to-emerald-900/95 border-2 border-green-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">♻️</div>
              <h2 className="text-2xl font-extrabold text-white mb-2">
                Restore Orders?
              </h2>
              <p className="text-white/80 text-sm mb-4">
                This will restore {selectedOrders.length} order(s) and make them visible again.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowRestoreModal(false)}
                disabled={processing}
                className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                disabled={processing}
                className="flex-1 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Restoring..." : "Restore Orders"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-red-900/95 to-orange-900/95 border-2 border-red-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🗑️</div>
              <h2 className="text-2xl font-extrabold text-white mb-2">
                Permanently Delete Orders?
              </h2>
              <p className="text-white/80 text-sm mb-4">
                This action is IRREVERSIBLE and will permanently delete {selectedOrders.length} order(s) from the database.
              </p>
              <p className="text-white/80 text-sm mb-6">
                This cannot be undone. Type <span className="text-red-400 font-extrabold">DELETE PERMANENTLY</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE PERMANENTLY here"
                className="w-full px-4 py-3 rounded-xl bg-black/60 border-2 border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-red-500/50 transition text-center font-mono text-sm"
                autoFocus
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={processing}
                className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={deleteConfirmText !== "DELETE PERMANENTLY" || processing}
                className="flex-1 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-2 ${
          toast.type === "success" 
            ? "bg-green-900/95 border-green-500/50 text-white" 
            : "bg-red-900/95 border-red-500/50 text-white"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{toast.type === "success" ? "✅" : "❌"}</span>
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
