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
      return NextResponse.json(
        { error: "Identifier and password required" },
        { status: 400 }
      );
    }

    // Find user by email or phone in MongoDB
    let user;
    if (isEmail(id)) {
      // Email login - check MongoDB
      user = await User.findOne({ email: id }).select("+passwordHash").lean();
    } else {
      // Phone login - check MongoDB
      const phone = id.replace(/\D/g, "").slice(0, 10);
      user = await User.findOne({ phone }).select("+passwordHash").lean();
    }

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Compare password using bcrypt
    const passwordMatch = await bcrypt.compare(pw, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Login successful - create JWT token and set cookie
    const token = signUserToken({ userId: user._id.toString() });
    const res = NextResponse.json({ success: true });
    setUserAuthCookie(res, token);
    return res;
  } catch (error) {
    console.error("Login error:", error);
    // Always return a proper response, never throw
    return NextResponse.json(
      { error: error.message || "Login failed. Please try again." },
      { status: 500 }
    );
  }
}

