import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("admin_token")?.value;

  // ❌ Not logged in
  if (!token) {
    return NextResponse.redirect(
      new URL("/admin/login", req.url)
    );
  }

  // ✅ Token exists → allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/dashboard/:path*",
    "/admin/products/:path*",
    "/admin/reels/:path*",
    "/admin/coupons/:path*"
  ]
};
