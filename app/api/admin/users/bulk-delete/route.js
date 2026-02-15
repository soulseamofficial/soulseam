import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import Admin from "@/app/models/Admin";
import { requireAdminAuth } from "@/app/lib/adminAuth";
import mongoose from "mongoose";

export async function DELETE(req) {
  // Verify admin authentication
  const { authorized, error } = await requireAdminAuth(req);
  
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // Parse request body
    const body = await req.json();
    const { userIds } = body;

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "userIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate all userIds are valid ObjectIds
    const validUserIds = userIds.filter(id => {
      return id && mongoose.Types.ObjectId.isValid(id);
    });

    if (validUserIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid user IDs provided" },
        { status: 400 }
      );
    }

    // Get all users to check for admin accounts
    // Fetch users with role and email to check for admin accounts
    const usersToDelete = await User.find({ _id: { $in: validUserIds } })
      .select("_id email role")
      .lean();

    if (usersToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: "No users found with the provided IDs" },
        { status: 404 }
      );
    }

    // Check if any user has role: "admin"
    const adminRoleUsers = usersToDelete.filter(u => u.role === "admin");
    if (adminRoleUsers.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete users with admin role` 
        },
        { status: 400 }
      );
    }

    // Check if any of the users are admin accounts (by email match with Admin collection)
    const userEmails = usersToDelete.map(u => u.email).filter(Boolean);
    if (userEmails.length > 0) {
      const adminAccounts = await Admin.find({ email: { $in: userEmails } })
        .select("email")
        .lean();

      if (adminAccounts.length > 0) {
        const adminEmails = adminAccounts.map(a => a.email);
        return NextResponse.json(
          { 
            success: false, 
            error: `Cannot delete admin accounts: ${adminEmails.join(", ")}` 
          },
          { status: 400 }
        );
      }
    }

    // Proceed with deletion
    const deleteResult = await User.deleteMany({ _id: { $in: validUserIds } });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} user(s)`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("[ADMIN_BULK_DELETE_USERS_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete users" },
      { status: 500 }
    );
  }
}
