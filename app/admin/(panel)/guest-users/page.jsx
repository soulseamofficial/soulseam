"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Guest User Row Component
function GuestUserRow({ user, orderCount }) {
  const router = useRouter();

  const handleViewOrders = () => {
    router.push(`/admin/orders?guestUserId=${user._id}`);
  };

  return (
    <div className="border border-white/10 rounded-2xl p-5 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-black/50">
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-white/90">{user.name || "Guest"}</p>
            <p className="text-xs text-white/60 mt-1">Guest User</p>
          </div>
          {orderCount > 0 ? (
            <button
              onClick={handleViewOrders}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-semibold transition transform hover:scale-105"
            >
              View Orders →
            </button>
          ) : (
            <span className="text-xs text-gray-400">No Orders</span>
          )}
        </div>
        <div className="space-y-2 text-sm">
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
      <div className="hidden md:grid md:grid-cols-4 gap-4 items-center">
        <div>
          <p className="font-semibold text-white/90">{user.name || "Guest"}</p>
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
          {orderCount > 0 ? (
            <button
              onClick={handleViewOrders}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold transition transform hover:scale-105"
            >
              View Orders →
            </button>
          ) : (
            <span className="text-sm text-gray-400">No Orders</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminGuestUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderCounts, setOrderCounts] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [searchInput, setSearchInput] = useState("");

  const fetchUsers = async (page = 1, searchTerm = "", sort = "createdAt", sortOrder = "desc") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sortBy: sort,
        order: sortOrder,
      });
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      
      const res = await fetch(`/api/admin/guest-users?${params.toString()}`, {
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (data.success) {
        const fetchedUsers = Array.isArray(data.users) ? data.users : [];
        setUsers(fetchedUsers);
        setPagination(data.pagination || pagination);
        
        // Fetch order counts for all guest users in parallel
        const counts = {};
        await Promise.all(
          fetchedUsers.map(async (user) => {
            try {
              const countRes = await fetch(`/api/admin/orders/count?guestUserId=${user._id}`, {
                credentials: "include",
              });
              const countData = await countRes.json();
              counts[user._id] = countData.success ? countData.count : 0;
            } catch (err) {
              counts[user._id] = 0;
            }
          })
        );
        setOrderCounts(counts);
      } else {
        setUsers([]);
        setOrderCounts({});
      }
    } catch (err) {
      setUsers([]);
      setOrderCounts({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, search, sortBy, order);
  }, [search, sortBy, order]);

  const handleSearch = () => {
    setSearch(searchInput);
    fetchUsers(1, searchInput, sortBy, order);
  };

  return (
    <div className="text-white">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-zinc-200 bg-clip-text text-transparent">
          Guest Users
        </h1>
        <p className="text-white/60 mt-2">
          Manage guest customer accounts
        </p>
      </div>

      {/* Search and Sort Bar */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name or phone..."
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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-white/30"
          >
            <option value="createdAt">Sort By</option>
            <option value="createdAt">Created Date</option>
            <option value="name">Name</option>
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

      {loading ? (
        <div className="bg-white/10 border border-white/15 rounded-2xl p-12 text-center">
          <div className="text-white/60">Loading customers...</div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white/10 border border-white/15 rounded-2xl p-12 text-center">
          <div className="text-white/60">No guest users yet</div>
        </div>
      ) : (
        <>
          {/* Desktop Table Header */}
          <div className="hidden md:grid md:grid-cols-4 gap-4 mb-4 px-5 py-3 bg-white/5 border border-white/10 rounded-xl">
            <div className="font-bold text-white/90">Name</div>
            <div className="font-bold text-white/90">Phone</div>
            <div className="font-bold text-white/90">Created Date</div>
            <div className="font-bold text-white/90">Orders</div>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {users.map((user) => (
              <GuestUserRow key={user._id} user={user} orderCount={orderCounts[user._id] || 0} />
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
                  onClick={() => fetchUsers(pagination.page - 1, search, sortBy, order)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchUsers(pagination.page + 1, search, sortBy, order)}
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
