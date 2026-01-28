import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import { setUserAuthCookie, signUserToken } from "@/app/lib/auth";

function isEmail(identifier) {
  return typeof identifier === "string" && identifier.includes("@");
}

export async function POST(req) {
  try {
    await connectDB();
    const { identifier, password } = await req.json();

    const id = typeof identifier === "string" ? identifier.trim().toLowerCase() : "";
    const pw = typeof password === "string" ? password : "";

    if (!id || !pw) {
      return NextResponse.json({ message: "Identifier and password required" }, { status: 400 });
    }

    const query = isEmail(id) ? { email: id } : { phone: id.replace(/\D/g, "").slice(0, 10) };
    const user = await User.findOne(query).select("+passwordHash").lean();
    if (!user?.passwordHash) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(pw, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const token = signUserToken({ userId: user._id.toString() });
    const res = NextResponse.json({ success: true });
    setUserAuthCookie(res, token);
    return res;
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

