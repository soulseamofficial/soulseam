import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import GuestUser from "@/app/models/GuestUser";
import Order from "@/app/models/Order";
import { requireAdminAuth } from "@/app/lib/adminAuth";

export async function GET(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") || "desc";
    const type = searchParams.get("type") || ""; // "USER", "GUEST", or empty for all
    const ordersFilter = searchParams.get("ordersFilter") || ""; // "withOrders", "noOrders", or empty
    const dateFilter = searchParams.get("dateFilter") || ""; // "today", "last7days", "last30days", "thisYear"
    const showDeleted = searchParams.get("showDeleted") === "true"; // Show deleted customers

    // Validate pagination params
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 per page

    // Build base filter (exclude deleted by default)
    const baseFilter = showDeleted
      ? { isDeleted: true } // Show only deleted
      : { isDeleted: { $ne: true } }; // Exclude deleted (default)

    // Build search filter
    const searchFilter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Build date filter
    let dateFilterObj = {};
    if (dateFilter && !showDeleted) {
      const now = new Date();
      let startDate;
      
      switch (dateFilter) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "last7days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "last30days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "thisYear":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        dateFilterObj = { createdAt: { $gte: startDate } };
      }
    }

    // Combine all filters
    const userFilter = {
      ...baseFilter,
      ...searchFilter,
      ...dateFilterObj,
    };

    const guestFilter = {
      ...baseFilter,
      ...searchFilter,
      ...dateFilterObj,
    };

    // Fetch users and guests in parallel
    const [users, guestUsers] = await Promise.all([
      // Fetch registered users
      type === "GUEST"
        ? []
        : User.find(userFilter)
            .select("_id name email phone createdAt isDeleted deletedAt")
            .lean(),
      // Fetch guest users
      type === "USER"
        ? []
        : GuestUser.find(guestFilter)
            .select("_id name email phone createdAt isDeleted deletedAt")
            .lean(),
    ]);

    // Normalize and combine customers
    const normalizedUsers = users.map((user) => ({
      _id: user._id.toString(),
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      customerType: "USER",
      createdAt: user.createdAt,
      isDeleted: user.isDeleted || false,
      deletedAt: user.deletedAt || null,
      ordersCount: 0, // Will be calculated below
    }));

    const normalizedGuests = guestUsers.map((guest) => ({
      _id: guest._id.toString(),
      name: guest.name || "",
      email: guest.email || "",
      phone: guest.phone || "",
      customerType: "GUEST",
      createdAt: guest.createdAt,
      isDeleted: guest.isDeleted || false,
      deletedAt: guest.deletedAt || null,
      ordersCount: 0, // Will be calculated below
    }));

    // Combine all customers
    let allCustomers = [...normalizedUsers, ...normalizedGuests];

    // Calculate orders count efficiently using aggregation
    const userIds = normalizedUsers.map((u) => u._id);
    const guestUserIds = normalizedGuests.map((g) => g._id);

    const [userOrdersCounts, guestOrdersCounts] = await Promise.all([
      userIds.length > 0
        ? Order.aggregate([
            { $match: { userId: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
            { $group: { _id: "$userId", count: { $sum: 1 } } },
          ])
        : [],
      guestUserIds.length > 0
        ? Order.aggregate([
            { $match: { guestUserId: { $in: guestUserIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
            { $group: { _id: "$guestUserId", count: { $sum: 1 } } },
          ])
        : [],
    ]);

    // Create orders count map
    const ordersCountMap = {};
    userOrdersCounts.forEach((item) => {
      ordersCountMap[item._id.toString()] = item.count;
    });
    guestOrdersCounts.forEach((item) => {
      ordersCountMap[item._id.toString()] = item.count;
    });

    // Add orders count to customers
    allCustomers = allCustomers.map((customer) => ({
      ...customer,
      ordersCount: ordersCountMap[customer._id] || 0,
    }));

    // Apply orders filter
    if (ordersFilter === "withOrders") {
      allCustomers = allCustomers.filter((c) => c.ordersCount > 0);
    } else if (ordersFilter === "noOrders") {
      allCustomers = allCustomers.filter((c) => c.ordersCount === 0);
    }

    // Apply sorting
    const sortOrder = order === "asc" ? 1 : -1;
    if (sortBy === "name") {
      allCustomers.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB) * sortOrder;
      });
    } else if (sortBy === "createdAt") {
      allCustomers.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return (dateA - dateB) * sortOrder;
      });
    }

    // Apply pagination
    const total = allCustomers.length;
    const skip = (validPage - 1) * validLimit;
    const paginatedCustomers = allCustomers.slice(skip, skip + validLimit);
    const pages = Math.ceil(total / validLimit);

    return NextResponse.json({
      success: true,
      customers: paginatedCustomers,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("[ADMIN_CUSTOMERS_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers", customers: [] },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await req.json();
    const { customerIds } = body; // Array of { _id, customerType } objects

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid customer IDs" },
        { status: 400 }
      );
    }

    // Separate users and guests
    const userIds = customerIds
      .filter((c) => c.customerType === "USER")
      .map((c) => new mongoose.Types.ObjectId(c._id));
    const guestUserIds = customerIds
      .filter((c) => c.customerType === "GUEST")
      .map((c) => new mongoose.Types.ObjectId(c._id));

    // Check which customers have orders
    const [userOrders, guestOrders] = await Promise.all([
      userIds.length > 0
        ? Order.find({ userId: { $in: userIds } }).select("userId").lean()
        : [],
      guestUserIds.length > 0
        ? Order.find({ guestUserId: { $in: guestUserIds } }).select("guestUserId").lean()
        : [],
    ]);

    // Create sets of IDs that have orders
    const usersWithOrders = new Set(
      userOrders.map((o) => o.userId.toString())
    );
    const guestsWithOrders = new Set(
      guestOrders.map((o) => o.guestUserId.toString())
    );

    // Separate customers into soft delete (with orders) and hard delete (no orders)
    const usersToSoftDelete = userIds.filter((id) =>
      usersWithOrders.has(id.toString())
    );
    const usersToHardDelete = userIds.filter(
      (id) => !usersWithOrders.has(id.toString())
    );
    const guestsToSoftDelete = guestUserIds.filter((id) =>
      guestsWithOrders.has(id.toString())
    );
    const guestsToHardDelete = guestUserIds.filter(
      (id) => !guestsWithOrders.has(id.toString())
    );

    // Perform bulk operations
    const results = {
      softDeleted: 0,
      hardDeleted: 0,
      errors: [],
    };

    // Soft delete users with orders
    if (usersToSoftDelete.length > 0) {
      const updateResult = await User.updateMany(
        { _id: { $in: usersToSoftDelete } },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );
      results.softDeleted += updateResult.modifiedCount;
    }

    // Hard delete users without orders
    if (usersToHardDelete.length > 0) {
      const deleteResult = await User.deleteMany({
        _id: { $in: usersToHardDelete },
      });
      results.hardDeleted += deleteResult.deletedCount;
    }

    // Soft delete guests with orders
    if (guestsToSoftDelete.length > 0) {
      const updateResult = await GuestUser.updateMany(
        { _id: { $in: guestsToSoftDelete } },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );
      results.softDeleted += updateResult.modifiedCount;
    }

    // Hard delete guests without orders
    if (guestsToHardDelete.length > 0) {
      const deleteResult = await GuestUser.deleteMany({
        _id: { $in: guestsToHardDelete },
      });
      results.hardDeleted += deleteResult.deletedCount;
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${results.softDeleted + results.hardDeleted} customer(s)`,
      results: {
        softDeleted: results.softDeleted,
        hardDeleted: results.hardDeleted,
        total: results.softDeleted + results.hardDeleted,
      },
    });
  } catch (error) {
    console.error("[ADMIN_CUSTOMERS_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete customers" },
      { status: 500 }
    );
  }
}
