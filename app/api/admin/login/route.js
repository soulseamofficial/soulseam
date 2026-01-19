import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Admin from "../../../models/Admin";
import bcrypt from "bcryptjs";

export async function POST(req) {
  await connectDB();

  const { email, password } = await req.json();

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin || !admin.isActive) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  admin.lastLogin = new Date();
  await admin.save();

  const res = NextResponse.json({ success: true });

  // 🔒 SECURE COOKIE
  res.cookies.set("admin", "1", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8 // 8 hours
  });

  return res;
}
