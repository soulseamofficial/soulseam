import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("admin_token")?.value;

  const isAdminPath = pathname.startsWith("/admin");
  const isLoginPath = pathname === "/admin/login";

  // Only run middleware for admin UI pages
  if (!isAdminPath) {
    return NextResponse.next();
  }

  // Not logged in → block protected admin pages (everything except login)
  if (!token && !isLoginPath) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in and trying to access login page → send to dashboard
  if (token && isLoginPath) {
    const dashboardUrl = new URL("/admin/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Logged in on protected page OR visiting login when not matched above
  return NextResponse.next();
}

export const config = {
  // Apply only to admin UI routes; API routes (/api/*) are not matched
  matcher: ["/admin/:path*"],
};

