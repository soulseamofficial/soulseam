import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname, searchParams } = req.nextUrl;
  const isAdmin = req.cookies.get("admin")?.value === "1";

  // ❌ Block admin register
  if (pathname === "/admin/register") {
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  // 🕵️ Secret admin login page
  if (pathname === "/admin/portal") {
    const key = searchParams.get("key");
    const secret = process.env.ADMIN_ENTRY_KEY;

    if (!secret || key !== secret) {
      return NextResponse.rewrite(new URL("/404", req.url));
    }

    return NextResponse.next(); // allow portal
  }

  // 🔐 Protect all other admin pages
  if (pathname.startsWith("/admin")) {
    if (!isAdmin) {
      return NextResponse.redirect(
        new URL(
          `/admin/portal?key=${process.env.ADMIN_ENTRY_KEY}`,
          req.url
        )
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
