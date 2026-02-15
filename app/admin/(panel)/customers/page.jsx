"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/app/components/Toast";

// Select All Checkbox Component
function SelectAllCheckbox({ checked, indeterminate, onChange }) {
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={checkboxRef}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-5 h-5 rounded border-white/30 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500"
    />
  );
}

// Badge Component for Customer Type
function CustomerTypeBadge({ customerType }) {
  const isUser = customerType === "USER";
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
        isUser
          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
          : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
      }`}
    >
      {customerType}
    </span>
  );
}

// Customer Row Component
function CustomerRow({ customer, isSelected, onSelect }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewOrders = () => {
    const param =
      customer.customerType === "USER"
        ? `userId=${customer._id}`
        : `guestUserId=${customer._id}`;
    router.push(`/admin/orders?${param}`);
  };

  const handleRowClick = (e) => {
    // Don't toggle if clicking checkbox or button
    if (e.target.type === "checkbox" || e.target.closest("button")) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const shippingAddress = customer.shippingAddress;
  const hasAddress = shippingAddress && shippingAddress.addressLine1;

  return (
    <div className="border border-white/10 rounded-2xl bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-black/50">
      {/* Mobile Card View */}
      <div className="md:hidden p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(customer._id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 rounded border-white/30 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1" onClick={handleRowClick} style={{ cursor: "pointer" }}>
              <p className="font-semibold text-white/90">{customer.name || "N/A"}</p>
              <div className="mt-1">
                <CustomerTypeBadge customerType={customer.customerType} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasAddress && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-1 text-white/60 hover:text-white/90 transition"
                aria-label="Toggle address"
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            {customer.ordersCount > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewOrders();
                }}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
              >
                View Orders →
              </button>
            ) : (
              <span className="text-xs text-white/40">No Orders</span>
            )}
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs text-white/50">Email</p>
            <p className="text-white/90 break-all">{customer.email || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Phone</p>
            <p className="text-white/90">{customer.phone || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Orders Count</p>
            <p className="text-white/90">Orders: {customer.ordersCount || 0}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Registered On</p>
            <p className="text-white/90">
              {formatDate(customer.registeredDate || customer.createdAt)}
            </p>
          </div>
        </div>
        {/* Address Accordion */}
        {hasAddress && (
          <div
            className={`mt-3 overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="pt-3 border-t border-white/10 space-y-2 text-sm">
              <p className="text-xs font-semibold text-white/70 mb-2">Shipping Address</p>
              <div>
                <p className="text-xs text-white/50">Full Name</p>
                <p className="text-white/90">{shippingAddress.fullName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Phone</p>
                <p className="text-white/90">{shippingAddress.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Address Line 1</p>
                <p className="text-white/90">{shippingAddress.addressLine1 || "N/A"}</p>
              </div>
              {shippingAddress.addressLine2 && (
                <div>
                  <p className="text-xs text-white/50">Address Line 2</p>
                  <p className="text-white/90">{shippingAddress.addressLine2}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-white/50">City</p>
                <p className="text-white/90">{shippingAddress.city || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">State</p>
                <p className="text-white/90">{shippingAddress.state || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Pincode</p>
                <p className="text-white/90">{shippingAddress.pincode || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Country</p>
                <p className="text-white/90">{shippingAddress.country || "N/A"}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table Row */}
      <div
        className="hidden md:grid md:grid-cols-8 gap-4 items-center p-5 cursor-pointer"
        onClick={handleRowClick}
      >
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(customer._id, e.target.checked)}
            className="w-5 h-5 rounded border-white/30 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <p className="font-semibold text-white/90">{customer.name || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-white/90 break-all">
            {customer.email || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-white/90">{customer.phone || "N/A"}</p>
        </div>
        <div>
          <CustomerTypeBadge customerType={customer.customerType} />
        </div>
        <div>
          <p className="text-sm text-white/90">
            {formatDate(customer.registeredDate || customer.createdAt)}
          </p>
        </div>
        <div>
          <p className="text-sm text-white/90">Orders: {customer.ordersCount || 0}</p>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {hasAddress && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 text-white/60 hover:text-white/90 transition"
              aria-label="Toggle address"
            >
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {customer.ordersCount > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewOrders();
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
            >
              View Orders →
            </button>
          ) : (
            <span className="text-sm text-white/40">No Orders</span>
          )}
        </div>
      </div>

      {/* Desktop Address Accordion */}
      {hasAddress && (
        <div
          className={`hidden md:block overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-5 pb-5 border-t border-white/10 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-white/50 mb-1">Full Name</p>
                <p className="text-white/90">{shippingAddress.fullName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Phone</p>
                <p className="text-white/90">{shippingAddress.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Address Line 1</p>
                <p className="text-white/90">{shippingAddress.addressLine1 || "N/A"}</p>
              </div>
              {shippingAddress.addressLine2 && (
                <div>
                  <p className="text-xs text-white/50 mb-1">Address Line 2</p>
                  <p className="text-white/90">{shippingAddress.addressLine2}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-white/50 mb-1">City</p>
                <p className="text-white/90">{shippingAddress.city || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">State</p>
                <p className="text-white/90">{shippingAddress.state || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Pincode</p>
                <p className="text-white/90">{shippingAddress.pincode || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Country</p>
                <p className="text-white/90">{shippingAddress.country || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterType, setFilterType] = useState(""); // "", "USER", "GUEST"
  const [ordersFilter, setOrdersFilter] = useState(""); // "", "withOrders", "noOrders"
  const [dateFilter, setDateFilter] = useState(""); // "", "today", "last7days", "last30days", "thisYear"
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchCustomers = async (
    page = 1,
    searchTerm = "",
    sort = sortBy,
    order = sortOrder,
    type = filterType,
    orders = ordersFilter,
    date = dateFilter,
    deleted = showDeleted
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      
      if (searchTerm) params.append("search", searchTerm);
      if (sort) params.append("sortBy", sort);
      if (order) params.append("order", order);
      if (type) params.append("type", type);
      if (orders) params.append("ordersFilter", orders);
      if (date) params.append("dateFilter", date);
      if (deleted) params.append("showDeleted", "true");

      const res = await fetch(`/api/admin/customers?${params.toString()}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        setCustomers(Array.isArray(data.customers) ? data.customers : []);
        setPagination(data.pagination || pagination);
        // Clear selection when data changes
        setSelectedCustomers([]);
      } else {
        setCustomers([]);
        console.error("Error fetching customers:", data.error);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1, search, sortBy, sortOrder, filterType, ordersFilter, dateFilter, showDeleted);
  }, [sortBy, sortOrder, filterType, ordersFilter, dateFilter, showDeleted]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(1, search, sortBy, sortOrder, filterType, ordersFilter, dateFilter, showDeleted);
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle order if same field
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newOrder);
      fetchCustomers(1, search, newSortBy, newOrder, filterType, ordersFilter, dateFilter, showDeleted);
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
      fetchCustomers(1, search, newSortBy, "desc", filterType, ordersFilter, dateFilter, showDeleted);
    }
  };

  const handleClearFilters = () => {
    setFilterType("");
    setOrdersFilter("");
    setDateFilter("");
    setShowDeleted(false);
    setSearch("");
    fetchCustomers(1, "", sortBy, sortOrder, "", "", "", false);
  };

  const hasActiveFilters = filterType || ordersFilter || dateFilter || showDeleted || search;

  const handleSelectCustomer = (customerId, checked) => {
    if (checked) {
      const customer = customers.find((c) => c._id === customerId);
      if (customer) {
        setSelectedCustomers([...selectedCustomers, { _id: customerId, customerType: customer.customerType }]);
      }
    } else {
      setSelectedCustomers(selectedCustomers.filter((c) => c._id !== customerId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCustomers(
        customers.map((c) => ({ _id: c._id, customerType: c.customerType }))
      );
    } else {
      setSelectedCustomers([]);
    }
  };

  const allSelected = customers.length > 0 && selectedCustomers.length === customers.length;
  const someSelected = selectedCustomers.length > 0 && selectedCustomers.length < customers.length;

  const handleDeleteClick = () => {
    if (selectedCustomers.length === 0) return;
    setShowDeleteModal(true);
    setDeleteConfirmText("");
  };

  const handleDeleteCustomers = async () => {
    if (deleteConfirmText !== "DELETE") return;
    if (selectedCustomers.length === 0) return;

    try {
      setDeleting(true);
      const res = await fetch("/api/admin/customers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ customerIds: selectedCustomers }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Successfully deleted ${data.results.total} customer(s)`, "success");
        setShowDeleteModal(false);
        setDeleteConfirmText("");
        setSelectedCustomers([]);
        // Refresh the table
        fetchCustomers(1, search, sortBy, sortOrder, filterType, ordersFilter, dateFilter, showDeleted);
      } else {
        showToast(data.error || "Failed to delete customers", "error");
      }
    } catch (err) {
      console.error("Error deleting customers:", err);
      showToast("Failed to delete customers", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="text-white">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-zinc-200 bg-clip-text text-transparent">
          Customer Management
        </h1>
        <p className="text-white/60 mt-2">
          Manage all customers in one place - registered users and guests
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
          >
            Search
          </button>
        </form>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Customer Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/70">Type:</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                fetchCustomers(1, search, sortBy, sortOrder, e.target.value, ordersFilter, dateFilter, showDeleted);
              }}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-white/40 transition"
            >
              <option value="">All Customers</option>
              <option value="USER">Registered Users</option>
              <option value="GUEST">Guest Users</option>
            </select>
          </div>

          {/* Orders Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/70">Orders:</label>
            <select
              value={ordersFilter}
              onChange={(e) => {
                setOrdersFilter(e.target.value);
                fetchCustomers(1, search, sortBy, sortOrder, filterType, e.target.value, dateFilter, showDeleted);
              }}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-white/40 transition"
            >
              <option value="">All</option>
              <option value="withOrders">With Orders</option>
              <option value="noOrders">No Orders</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/70">Joined:</label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                fetchCustomers(1, search, sortBy, sortOrder, filterType, ordersFilter, e.target.value, showDeleted);
              }}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-white/40 transition"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>

          {/* Deleted Customers Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/70">Status:</label>
            <select
              value={showDeleted ? "deleted" : "active"}
              onChange={(e) => {
                const isDeleted = e.target.value === "deleted";
                setShowDeleted(isDeleted);
                fetchCustomers(1, search, sortBy, sortOrder, filterType, ordersFilter, dateFilter, isDeleted);
              }}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-white/40 transition"
            >
              <option value="active">Active Customers</option>
              <option value="deleted">Deleted Customers</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/70 hover:bg-white/15 transition text-sm font-semibold"
            >
              Clear Filters
            </button>
          )}

          {/* Sort Options */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-white/70">Sort:</label>
            <button
              onClick={() => handleSortChange("name")}
              className={`px-4 py-2 rounded-lg border transition ${
                sortBy === "name"
                  ? "bg-white/20 border-white/40 text-white"
                  : "bg-white/10 border-white/20 text-white/70 hover:bg-white/15"
              }`}
            >
              Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => handleSortChange("createdAt")}
              className={`px-4 py-2 rounded-lg border transition ${
                sortBy === "createdAt"
                  ? "bg-white/20 border-white/40 text-white"
                  : "bg-white/10 border-white/20 text-white/70 hover:bg-white/15"
              }`}
            >
              {sortBy === "createdAt" && sortOrder === "desc"
                ? "Newest First"
                : sortBy === "createdAt" && sortOrder === "asc"
                ? "Oldest First"
                : "Date"}
              {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar (when customers are selected) */}
      {selectedCustomers.length > 0 && (
        <>
          {/* Top Action Bar - More Visible */}
          <div className="mb-6 bg-red-500/20 border-2 border-red-500/50 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-white font-bold text-lg">
                  {selectedCustomers.length} Customer{selectedCustomers.length !== 1 ? 's' : ''} Selected
                </span>
                <button
                  onClick={() => setSelectedCustomers([])}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/70 hover:bg-white/15 transition text-sm font-semibold"
                >
                  Clear Selection
                </button>
              </div>
              <button
                onClick={handleDeleteClick}
                className="px-8 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold transition shadow-lg hover:shadow-red-500/50"
              >
                🗑️ Delete {selectedCustomers.length} Customer{selectedCustomers.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>

          {/* Floating Action Bar (Bottom) */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-black/95 border-2 border-red-500/50 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-6">
              <span className="text-white font-semibold">
                {selectedCustomers.length} Selected
              </span>
              <button
                onClick={handleDeleteClick}
                className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold transition"
              >
                Delete Customers
              </button>
            </div>
          </div>
        </>
      )}

      {/* Hint for Delete Feature */}
      {selectedCustomers.length === 0 && customers.length > 0 && (
        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <p className="text-sm text-blue-300">
            💡 <strong>Tip:</strong> Select customers using the checkboxes to enable bulk delete functionality.
          </p>
        </div>
      )}

      {/* Customers Table */}
      {loading ? (
        <div className="bg-white/10 border border-white/15 rounded-2xl p-12 text-center">
          <div className="text-white/60">Loading customers...</div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white/10 border border-white/15 rounded-2xl p-12 text-center">
          <div className="text-white/60">No customers found</div>
        </div>
      ) : (
        <>
          {/* Desktop Table Header */}
          <div className="hidden md:grid md:grid-cols-8 gap-4 mb-4 px-5 py-3 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center">
              <SelectAllCheckbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={handleSelectAll}
              />
            </div>
            <div className="font-bold text-white/90">Name</div>
            <div className="font-bold text-white/90">Email</div>
            <div className="font-bold text-white/90">Phone</div>
            <div className="font-bold text-white/90">Customer Type</div>
            <div className="font-bold text-white/90">Registered On</div>
            <div className="font-bold text-white/90">Orders Count</div>
            <div className="font-bold text-white/90">Actions</div>
          </div>

          {/* Customers List */}
          <div className="space-y-4">
            {customers.map((customer) => (
              <CustomerRow
                key={customer._id}
                customer={customer}
                isSelected={selectedCustomers.some((c) => c._id === customer._id)}
                onSelect={handleSelectCustomer}
              />
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
                  onClick={() => fetchCustomers(pagination.page - 1, search, sortBy, sortOrder, filterType, ordersFilter, dateFilter, showDeleted)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchCustomers(pagination.page + 1, search, sortBy, sortOrder, filterType, ordersFilter, dateFilter, showDeleted)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-black/95 border-2 border-red-500/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-extrabold text-white mb-4">
              Delete Customers?
            </h2>
            <p className="text-white/70 mb-6">
              This action may affect order history. Type <span className="font-bold text-red-400">DELETE</span> to confirm.
            </p>
            <div className="mb-6">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 transition"
                autoFocus
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={deleting}
                className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomers}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                className="flex-1 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete Customers"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
