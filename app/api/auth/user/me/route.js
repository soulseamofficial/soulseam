import { NextResponse } from "next/server";
import { getAuthUserFromCookies } from "@/app/lib/auth";

export async function GET() {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({
    user: {
      _id: user._id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      addresses: Array.isArray(user.addresses) ? user.addresses : [],
    },
  });
}

