import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Admin from "@/app/models/Admin";
import bcrypt from "bcryptjs";

/**
 * Bootstrap route to create the first admin user
 * This should be called once to set up the initial admin account
 * 
 * SECURITY: In production, this route should be protected or removed after initial setup
 * 
 * Usage: POST /api/admin/bootstrap
 * Body: { email: "admin@example.com", password: "securepassword" }
 */
export async function POST(req) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if any admin already exists
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      console.warn(`[Admin Bootstrap] Admin already exists. Skipping bootstrap.`);
      return NextResponse.json(
        { error: "Admin already exists. Use /api/admin/register to create additional admins." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create first admin
    const admin = await Admin.create({
      email: normalizedEmail,
      password: hashedPassword
    });

    console.log(`[Admin Bootstrap] ✅ First admin created successfully with email: ${normalizedEmail}`);
    
    return NextResponse.json({
      success: true,
      message: "First admin created successfully",
      adminId: admin._id,
      email: admin.email
    });
  } catch (err) {
    console.error("[Admin Bootstrap] Database error:", err);
    
    // Handle duplicate email error
    if (err.code === 11000 || err.message?.includes("duplicate")) {
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 }
    );
  }
}
