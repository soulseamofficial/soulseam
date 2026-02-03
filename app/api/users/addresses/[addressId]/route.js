import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import { getAuthUserFromCookies } from "@/app/lib/auth";

function sanitizeAddress(body) {
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const addressLine1 = typeof body?.addressLine1 === "string" ? body.addressLine1.trim() : "";
  const addressLine2 = typeof body?.addressLine2 === "string" ? body.addressLine2.trim() : "";
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const state = typeof body?.state === "string" ? body.state.trim() : "";
  const pincode = typeof body?.pincode === "string" ? body.pincode.trim() : "";
  const country = typeof body?.country === "string" ? body.country.trim() : "India";

  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    return { ok: false, message: "All address fields required" };
  }
  if (!/^[6-9]\d{9}$/.test(phone)) return { ok: false, message: "Valid phone required" };
  if (!/^\d{6}$/.test(pincode)) return { ok: false, message: "Valid pincode required" };

  return { ok: true, value: { fullName, phone, addressLine1, addressLine2, city, state, pincode, country } };
}

export async function PUT(req, { params }) {
  const authed = await getAuthUserFromCookies();
  if (!authed) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { addressId } = await params;
  if (!addressId) return NextResponse.json({ message: "Address ID missing" }, { status: 400 });

  const body = await req.json();
  const parsed = sanitizeAddress(body);
  if (!parsed.ok) return NextResponse.json({ message: parsed.message }, { status: 400 });

  const res = await User.updateOne(
    { _id: authed._id, "addresses._id": addressId },
    {
      $set: {
        "addresses.$.fullName": parsed.value.fullName,
        "addresses.$.phone": parsed.value.phone,
        "addresses.$.addressLine1": parsed.value.addressLine1,
        "addresses.$.addressLine2": parsed.value.addressLine2,
        "addresses.$.city": parsed.value.city,
        "addresses.$.state": parsed.value.state,
        "addresses.$.pincode": parsed.value.pincode,
        "addresses.$.country": parsed.value.country,
      },
    }
  );

  if (res.matchedCount === 0) return NextResponse.json({ message: "Address not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req, { params }) {
  const authed = await getAuthUserFromCookies();
  if (!authed) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { addressId } = await params;
  if (!addressId) return NextResponse.json({ message: "Address ID missing" }, { status: 400 });

  await User.updateOne({ _id: authed._id }, { $pull: { addresses: { _id: addressId } } });
  return NextResponse.json({ success: true });
}

