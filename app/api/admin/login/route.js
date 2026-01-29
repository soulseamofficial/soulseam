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
    console.log("Login attempt for email:", normalizedEmail);

    // Try both lowercase and original case to handle existing admins
    const admin = await Admin.findOne({ 
      $or: [
        { email: normalizedEmail },
        { email: email.trim() }
      ]
    }).select("+password");
    
    if (!admin) {
      console.log("Admin not found for email:", normalizedEmail);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log("Admin found, comparing password...");
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      console.log("Password mismatch for email:", normalizedEmail);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log("Login successful for email:", normalizedEmail);

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
    console.error("Admin login error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
