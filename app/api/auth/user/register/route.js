import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import { setUserAuthCookie, signUserToken } from "@/app/lib/auth";

function isValidEmail(email) {
  return typeof email === "string" && /^[\w-.]+@[\w-]+\.[\w-.]+$/.test(email);
}
function isValidPhone(phone) {
  return typeof phone === "string" && /^[6-9]\d{9}$/.test(phone);
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!name) return NextResponse.json({ message: "Name required" }, { status: 400 });
    if (!isValidEmail(email)) return NextResponse.json({ message: "Valid email required" }, { status: 400 });
    if (!isValidPhone(phone)) return NextResponse.json({ message: "Valid phone required" }, { status: 400 });
    if (!password || password.length < 6)
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });

    // Uniqueness (blocking) only for users collection
    const existing = await User.findOne({ $or: [{ email }, { phone }] }).lean();
    if (existing) {
      return NextResponse.json({ message: "Email or phone already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Optional initial address
    let addresses = [];
    const a = body?.address;
    if (a && typeof a === "object") {
      const fullName = name;
      const addressLine1 = typeof a.addressLine1 === "string" ? a.addressLine1 : typeof a.street === "string" ? a.street : "";
      const addressLine2 = typeof a.addressLine2 === "string" ? a.addressLine2 : typeof a.apartment === "string" ? a.apartment : "";
      const city = typeof a.city === "string" ? a.city : "";
      const state = typeof a.state === "string" ? a.state : "";
      const pincode = typeof a.pincode === "string" ? a.pincode : "";
      const country = typeof a.country === "string" ? a.country : "India";
      if (addressLine1 && city && state && pincode) {
        addresses = [
          {
            fullName,
            phone,
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
            country: country.trim(),
            createdAt: new Date(),
          },
        ];
      }
    }

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      provider: "local",
      addresses,
    });

    const token = signUserToken({ userId: user._id.toString() });
    const res = NextResponse.json({ success: true });
    setUserAuthCookie(res, token);
    return res;
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

