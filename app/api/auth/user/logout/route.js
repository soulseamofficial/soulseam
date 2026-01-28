import { NextResponse } from "next/server";
import { clearUserAuthCookie } from "@/app/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  clearUserAuthCookie(res);
  return res;
}

