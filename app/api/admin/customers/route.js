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

    // Fetch users and guests in parallel with addresses
    const [users, guestUsers] = await Promise.all([
      // Fetch registered users with addresses
      type === "GUEST"
        ? []
        : User.find(userFilter)
            .select("_id name email phone createdAt isDeleted deletedAt addresses")
            .lean(),
      // Fetch guest users with shipping address
      type === "USER"
        ? []
        : GuestUser.find(guestFilter)
            .select("_id name email phone createdAt isDeleted deletedAt shippingAddress")
            .lean(),
    ]);

    // Normalize customers
    const normalizedUsers = users.map((user) => ({
      _id: user._id.toString(),
      name: user.name || "",
      email: (user.email || "").toLowerCase().trim(),
      phone: (user.phone || "").trim(),
      customerType: "USER",
      createdAt: user.createdAt,
      isDeleted: user.isDeleted || false,
      deletedAt: user.deletedAt || null,
      addresses: user.addresses || [],
      ordersCount: 0, // Will be calculated below
      firstOrderDate: null, // Will be calculated below
      shippingAddress: null, // Will be calculated below
    }));

    const normalizedGuests = guestUsers.map((guest) => ({
      _id: guest._id.toString(),
      name: guest.name || "",
      email: (guest.email || "").toLowerCase().trim(),
      phone: (guest.phone || "").trim(),
      customerType: "GUEST",
      createdAt: guest.createdAt,
      isDeleted: guest.isDeleted || false,
      deletedAt: guest.deletedAt || null,
      shippingAddress: guest.shippingAddress || null,
      ordersCount: 0, // Will be calculated below
      firstOrderDate: null, // Will be calculated below
    }));

    // Get all customer IDs for efficient queries
    const userIds = normalizedUsers.map((u) => new mongoose.Types.ObjectId(u._id));
    const guestUserIds = normalizedGuests.map((g) => new mongoose.Types.ObjectId(g._id));

    // Fetch order counts, first order dates, and most recent shipping addresses in parallel using aggregation
    const [userOrdersData, guestOrdersData] = await Promise.all([
      userIds.length > 0
        ? Order.aggregate([
            {
              $match: {
                userId: { $in: userIds },
                isDeleted: { $ne: true },
              },
            },
            {
              $group: {
                _id: "$userId",
                count: { $sum: 1 },
                firstOrderDate: { $min: "$createdAt" },
                latestOrder: { $max: "$createdAt" },
              },
            },
          ])
        : [],
      guestUserIds.length > 0
        ? Order.aggregate([
            {
              $match: {
                guestUserId: { $in: guestUserIds },
                isDeleted: { $ne: true },
              },
            },
            {
              $group: {
                _id: "$guestUserId",
                count: { $sum: 1 },
                firstOrderDate: { $min: "$createdAt" },
                latestOrder: { $max: "$createdAt" },
              },
            },
          ])
        : [],
    ]);

    // Create maps for order data
    const ordersDataMap = {};
    [...userOrdersData, ...guestOrdersData].forEach((item) => {
      ordersDataMap[item._id.toString()] = {
        count: item.count,
        firstOrderDate: item.firstOrderDate,
        latestOrder: item.latestOrder,
      };
    });

    // Fetch most recent shipping addresses from orders for customers who don't have addresses
    const userIdsNeedingAddress = normalizedUsers
      .filter((u) => !u.addresses || u.addresses.length === 0)
      .map((u) => new mongoose.Types.ObjectId(u._id));
    const guestUserIdsNeedingAddress = normalizedGuests
      .filter((g) => !g.shippingAddress || !g.shippingAddress.addressLine1)
      .map((g) => new mongoose.Types.ObjectId(g._id));

    const [userLatestAddresses, guestLatestAddresses] = await Promise.all([
      userIdsNeedingAddress.length > 0
        ? Order.aggregate([
            {
              $match: {
                userId: { $in: userIdsNeedingAddress },
                isDeleted: { $ne: true },
                "shippingAddress.addressLine1": { $exists: true, $ne: "" },
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $group: {
                _id: "$userId",
                shippingAddress: { $first: "$shippingAddress" },
              },
            },
          ])
        : [],
      guestUserIdsNeedingAddress.length > 0
        ? Order.aggregate([
            {
              $match: {
                guestUserId: { $in: guestUserIdsNeedingAddress },
                isDeleted: { $ne: true },
                "shippingAddress.addressLine1": { $exists: true, $ne: "" },
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            {
              $group: {
                _id: "$guestUserId",
                shippingAddress: { $first: "$shippingAddress" },
              },
            },
          ])
        : [],
    ]);

    // Create address maps
    const addressMap = {};
    [...userLatestAddresses, ...guestLatestAddresses].forEach((item) => {
      addressMap[item._id.toString()] = item.shippingAddress;
    });

    // Add order counts, first order dates, and shipping addresses to customers
    normalizedUsers.forEach((customer) => {
      const orderData = ordersDataMap[customer._id];
      if (orderData) {
        customer.ordersCount = orderData.count;
        customer.firstOrderDate = orderData.firstOrderDate;
      }

      // Get shipping address: prefer from user addresses (most recent), fallback to order
      if (customer.addresses && customer.addresses.length > 0) {
        // Get most recent address
        const sortedAddresses = [...customer.addresses].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        customer.shippingAddress = sortedAddresses[0];
      } else if (addressMap[customer._id]) {
        customer.shippingAddress = addressMap[customer._id];
      }
    });

    normalizedGuests.forEach((customer) => {
      const orderData = ordersDataMap[customer._id];
      if (orderData) {
        customer.ordersCount = orderData.count;
        customer.firstOrderDate = orderData.firstOrderDate;
        // For guests, use first order date as registration date if available
        if (orderData.firstOrderDate) {
          customer.registeredDate = orderData.firstOrderDate;
        } else {
          customer.registeredDate = customer.createdAt;
        }
      } else {
        customer.registeredDate = customer.createdAt;
      }

      // Get shipping address: prefer from guest record, fallback to order
      if (!customer.shippingAddress || !customer.shippingAddress.addressLine1) {
        if (addressMap[customer._id]) {
          customer.shippingAddress = addressMap[customer._id];
        }
      }
    });

    // For users, set registeredDate to createdAt (they register before ordering)
    normalizedUsers.forEach((customer) => {
      customer.registeredDate = customer.createdAt;
    });

    // Combine all customers
    let allCustomers = [...normalizedUsers, ...normalizedGuests];

    // DEDUPLICATION LOGIC: Group by phone OR email, prioritize based on orders
    // Strategy: Build groups where customers share phone OR email, then pick best from each group
    const phoneMap = new Map(); // phone -> [customers]
    const emailMap = new Map(); // email -> [customers]
    const customerGroups = new Map(); // customer._id -> Set of customer IDs in same group

    // Build initial maps
    allCustomers.forEach((customer) => {
      if (customer.phone) {
        if (!phoneMap.has(customer.phone)) {
          phoneMap.set(customer.phone, []);
        }
        phoneMap.get(customer.phone).push(customer);
      }
      if (customer.email) {
        if (!emailMap.has(customer.email)) {
          emailMap.set(customer.email, []);
        }
        emailMap.get(customer.email).push(customer);
      }
    });

    // Build groups: customers that share phone OR email are in the same group
    allCustomers.forEach((customer) => {
      const group = new Set([customer._id]);
      
      // Add all customers with same phone
      if (customer.phone && phoneMap.has(customer.phone)) {
        phoneMap.get(customer.phone).forEach((c) => {
          if (c._id !== customer._id) {
            group.add(c._id);
          }
        });
      }
      
      // Add all customers with same email
      if (customer.email && emailMap.has(customer.email)) {
        emailMap.get(customer.email).forEach((c) => {
          if (c._id !== customer._id) {
            group.add(c._id);
          }
        });
      }
      
      customerGroups.set(customer._id, group);
    });

    // Merge groups (if A is in B's group and B is in C's group, they should all be together)
    const processed = new Set();
    const finalGroups = [];

    allCustomers.forEach((customer) => {
      if (processed.has(customer._id)) return;

      const group = new Set();
      const toProcess = [customer._id];

      while (toProcess.length > 0) {
        const currentId = toProcess.pop();
        if (processed.has(currentId)) continue;
        processed.add(currentId);
        group.add(currentId);

        const relatedGroup = customerGroups.get(currentId);
        if (relatedGroup) {
          relatedGroup.forEach((relatedId) => {
            if (!processed.has(relatedId)) {
              toProcess.push(relatedId);
            }
          });
        }
      }

      if (group.size > 0) {
        finalGroups.push(Array.from(group));
      }
    });

    // For each group, pick the best customer based on priority
    const selectedCustomerIds = new Set();
    finalGroups.forEach((group) => {
      const customersInGroup = allCustomers.filter((c) => group.includes(c._id));
      if (customersInGroup.length === 0) return;

      // Sort by priority (highest first)
      customersInGroup.sort((a, b) => {
        const priorityA = getCustomerPriority(a);
        const priorityB = getCustomerPriority(b);
        if (priorityB !== priorityA) {
          return priorityB - priorityA;
        }
        // If same priority, prefer USER
        if (a.customerType === "USER" && b.customerType === "GUEST") return -1;
        if (a.customerType === "GUEST" && b.customerType === "USER") return 1;
        return 0;
      });

      // Select the best customer
      selectedCustomerIds.add(customersInGroup[0]._id);
    });

    // Filter to only selected customers
    allCustomers = allCustomers.filter((c) => selectedCustomerIds.has(c._id));

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
        const dateA = new Date(a.registeredDate || a.createdAt).getTime();
        const dateB = new Date(b.registeredDate || b.createdAt).getTime();
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

// Helper function to calculate customer priority for deduplication
// Returns: 4 = USER with orders, 3 = GUEST with orders, 2 = USER without orders, 1 = GUEST without orders
function getCustomerPriority(customer) {
  if (customer.customerType === "USER" && customer.ordersCount > 0) return 4;
  if (customer.customerType === "GUEST" && customer.ordersCount > 0) return 3;
  if (customer.customerType === "USER" && customer.ordersCount === 0) return 2;
  return 1; // GUEST without orders
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
