import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/app/lib/db";
import Admin from "@/app/models/Admin";

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

    const normalizedEmail = email.trim().toLowerCase();
    
    // Find admin by email (case-insensitive lookup for consistency)
    const admin = await Admin.findOne({ 
      email: normalizedEmail
    }).select("+password");
    
    if (!admin) {
      console.error(`[Admin Login] Admin not found for email: ${normalizedEmail}`);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      console.error(`[Admin Login] Password mismatch for email: ${normalizedEmail}`);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log(`[Admin Login] Successful login for email: ${normalizedEmail}`);

    // ✅ Token is admin ID
    const token = admin._id.toString();

    // ✅ Create response
    const res = NextResponse.json({ success: true });

    // 🔥 Set cookie with proper options
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return res;
  } catch (err) {
    console.error("[Admin Login] Database error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
