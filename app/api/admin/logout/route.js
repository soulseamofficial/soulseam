import { NextResponse } from "next/server";

// Simple logout: just clear the admin_token cookie
export async function POST() {
  const res = NextResponse.json({ success: true });

  // Delete the same cookie that login sets (with same options)
  res.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0 // Expire immediately
  });

  return res;
}
