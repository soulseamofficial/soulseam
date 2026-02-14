"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// User Row Component (for mobile cards)
function UserRow({ user, isGuest = false }) {
  const router = useRouter();

  const handleViewOrders = () => {
    const param = isGuest ? `guestUserId=${user._id}` : `userId=${user._id}`;
    router.push(`/admin/orders?${param}`);
  };

  return (
    <div className="border border-white/10 rounded-2xl p-5 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-black/50">
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-white/90">{user.name || "N/A"}</p>
            <p className="text-xs text-white/60 mt-1">
              {isGuest ? "Guest User" : "Registered User"}
            </p>
          </div>
          <button
            onClick={handleViewOrders}
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
          >
            View Orders →
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs text-white/50">Email</p>
            <p className="text-white/90 break-all">{user.email || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Phone</p>
            <p className="text-white/90">{user.phone || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Joined Date</p>
            <p className="text-white/90">
              {new Date(user.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Table Row */}
      <div className="hidden md:grid md:grid-cols-5 gap-4 items-center">
        <div>
          <p className="font-semibold text-white/90">{user.name || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-white/90 break-all">
            {user.email || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-white/90">{user.phone || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-white/90">
            {new Date(user.createdAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <div>
          <button
            onClick={handleViewOrders}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
          >
            View Orders →
          </button>
        </div>
      </div>
    </div>
  );
}

// Users Table Component
function UsersTable({ title, fetchUrl, isGuest = false }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`${fetchUrl}?page=${page}&limit=20`, {
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (data.success) {
        setUsers(Array.isArray(data.users) ? data.users : []);
        setPagination(data.pagination || pagination);
      } else {
        setUsers([]);
        console.error(`Error fetching ${title}:`, data.error);
      }
    } catch (err) {
      console.error(`Error fetching ${title}:`, err);
      setUsers([]); // CRITICAL: Always set empty array on error
    } finally {
      setLoading(false); // CRITICAL: Always stop loading
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUrl]);

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-zinc-200 bg-clip-text text-transparent mb-6">
        {title}
      </h2>

      {loading ? (
        <div className="bg-white/10 border border-white/15 rounded-2xl p-12 text-center">
          <div className="text-white/60">Loading customers...</div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white/10 border border-white/15 rounded-2xl p-12 text-center">
          <div className="text-white/60">
            {isGuest ? "No guest users found" : "No users found"}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table Header */}
          <div className="hidden md:grid md:grid-cols-5 gap-4 mb-4 px-5 py-3 bg-white/5 border border-white/10 rounded-xl">
            <div className="font-bold text-white/90">Name</div>
            <div className="font-bold text-white/90">Email</div>
            <div className="font-bold text-white/90">Phone</div>
            <div className="font-bold text-white/90">Joined Date</div>
            <div className="font-bold text-white/90">Actions</div>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {users.map((user) => (
              <UserRow
                key={user._id}
                user={user}
                isGuest={isGuest}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-white/70">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchUsers(pagination.page + 1)}
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
    </div>
  );
}

export default function AdminCustomersPage() {
  return (
    <div className="text-white">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-zinc-200 bg-clip-text text-transparent">
          Customer Management
        </h1>
        <p className="text-white/60 mt-2">
          Manage registered users and guest customers
        </p>
      </div>

      {/* Registered Users Section */}
      <UsersTable
        title="Registered Users"
        fetchUrl="/api/admin/users"
        isGuest={false}
      />

      {/* Guest Users Section */}
      <UsersTable
        title="Guest Users"
        fetchUrl="/api/admin/guest-users"
        isGuest={true}
      />
    </div>
  );
}
