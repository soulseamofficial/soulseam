import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import GuestUser from "@/app/models/GuestUser";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const guestSessionId = typeof body?.guestSessionId === "string" ? body.guestSessionId.trim() : "";
    if (!guestSessionId) {
      return NextResponse.json({ message: "guestSessionId required" }, { status: 400 });
    }

    // Never block checkout on duplicates in users collection.
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const a = body?.shippingAddress || {};

    const shippingAddress = {
      fullName: typeof a.fullName === "string" ? a.fullName.trim() : name,
      phone: typeof a.phone === "string" ? a.phone.trim() : phone,
      addressLine1: typeof a.addressLine1 === "string" ? a.addressLine1.trim() : "",
      addressLine2: typeof a.addressLine2 === "string" ? a.addressLine2.trim() : "",
      city: typeof a.city === "string" ? a.city.trim() : "",
      state: typeof a.state === "string" ? a.state.trim() : "",
      pincode: typeof a.pincode === "string" ? a.pincode.trim() : "",
      country: typeof a.country === "string" ? a.country.trim() : "India",
    };

    const guest = await GuestUser.findOneAndUpdate(
      { guestSessionId },
      {
        $setOnInsert: { createdAt: new Date() },
        $set: { name, email, phone, shippingAddress },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ guestUserId: guest._id.toString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

