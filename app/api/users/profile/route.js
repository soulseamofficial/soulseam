import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import { getAuthUserFromCookies } from "@/app/lib/auth";

function isValidPhone(phone) {
  return typeof phone === "string" && /^[6-9]\d{9}$/.test(phone);
}

export async function GET() {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

export async function PUT(req) {
  const authed = await getAuthUserFromCookies();
  if (!authed) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { name } = await req.json();

  // Phone number is immutable - ignore any phone field sent from client
  const nextName = typeof name === "string" ? name.trim() : "";

  if (!nextName) return NextResponse.json({ message: "Name required" }, { status: 400 });

  // Only update name - phone number remains unchanged (immutable)
  await User.updateOne(
    { _id: authed._id },
    { $set: { name: nextName } }
  );

  return NextResponse.json({ success: true });
}

