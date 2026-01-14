import mongoose from "mongoose";
import Admin from "../../../models/Admin.js";

export async function POST(req) {
  await mongoose.connect(process.env.MONGODB_URI);

  const { email, password } = await req.json();

  const existing = await Admin.findOne({ email });

  if (existing) {
    return Response.json(
      { message: "Email already exists" },
      { status: 400 }
    );
  }

  const admin = await Admin.create({ email, password });

  return Response.json({ success: true, admin });
}
