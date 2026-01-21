import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/app/lib/db";
import Admin from "@/app/models/Admin";

export async function POST(req) {
  await connectDB();

  const { email, password } = await req.json();

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // ✅ simple token (random / admin id)
  const token = admin._id.toString();

  // ✅ RESPONSE CREATE
  const res = NextResponse.json({ success: true });

  // 🔥 COOKIE SET HERE
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // ⭐ very important
    path: "/"
  });

  return res;
}
