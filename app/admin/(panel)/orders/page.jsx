"use client";

import { useEffect, useState } from "react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="p-10 text-white text-xl flex items-center justify-center min-h-[400px]">
        <div className="bg-gradient-to-b from-white/10 to-white/0 border border-white/15 rounded-2xl p-8 backdrop-blur-xl shadow-[0_20px_80px_rgba(255,255,255,0.13)]">
          Loading orders...
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 text-white">
      <h1 className="text-4xl font-extrabold mb-10 bg-gradient-to-br from-white via-white/96 to-zinc-200/80 bg-clip-text text-transparent drop-shadow-[0_4px_26px_rgba(255,255,255,0.11)] tracking-tight">
        Orders
      </h1>

      {orders.length === 0 ? (
        <div className="bg-gradient-to-b from-white/10 to-white/0 border border-white/15 rounded-2xl p-12 backdrop-blur-xl shadow-[0_20px_80px_rgba(255,255,255,0.13)] text-center">
          <p className="text-white/70 text-lg">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div
              key={order._id}
              className="bg-gradient-to-b from-white/10 to-white/0 border border-white/15 rounded-2xl p-6 sm:p-8 shadow-[0_20px_80px_rgba(255,255,255,0.13)] backdrop-blur-xl hover:-translate-y-1 hover:shadow-[0_32px_100px_rgba(255,255,255,0.19)] hover:border-white/25 transition-all duration-300"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-white/70 mb-1">Order ID</p>
                  <p className="font-semibold text-white break-all">{order._id}</p>
                </div>
                <div>
                  <p className="text-sm text-white/70 mb-1">Status</p>
                  <p className="font-semibold text-white capitalize">{order.orderStatus}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-white/70 mb-1">Customer</p>
                  <p className="font-semibold text-white">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/70 mb-1">Email</p>
                  <p className="font-semibold text-white break-all">{order.customer?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-white/70 mb-1">Total</p>
                  <p className="font-extrabold text-xl text-white">₹{order.total}</p>
                </div>
                <div>
                  <p className="text-sm text-white/70 mb-1">Payment</p>
                  <p className="font-semibold text-white capitalize">
                    {order.payment?.status} ({order.payment?.method || 'N/A'})
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/12">
                <p className="text-sm text-white/50">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}