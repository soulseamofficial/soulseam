import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import GuestUser from "@/app/models/GuestUser";
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
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") || "desc";

    // Validate pagination params
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 per page

    // Calculate skip
    const skip = (validPage - 1) * validLimit;

    // Build search filter
    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    // Build sort object
    const sortObj = {
      [sortBy]: order === "asc" ? 1 : -1
    };

    // Fetch guest users with pagination, search, and sort
    // Only select safe fields: _id, name, phone, createdAt (email optional)
    const guestUsers = await GuestUser.find(filter)
      .select("_id name phone createdAt")
      .sort(sortObj)
      .skip(skip)
      .limit(validLimit)
      .lean();

    // Get total count for pagination (with search filter)
    const total = await GuestUser.countDocuments(filter);

    // Calculate total pages
    const pages = Math.ceil(total / validLimit);

    return NextResponse.json({
      success: true,
      users: guestUsers,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("[ADMIN_GUEST_USERS_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch guest users", users: [] },
      { status: 500 }
    );
  }
}
