import { NextResponse } from "next/server";

// Simple logout: just clear the admin_token cookie
export async function POST() {
  const res = NextResponse.json({ success: true });

  // Delete the same cookie that login sets
  res.cookies.delete("admin_token");

  return res;
}
