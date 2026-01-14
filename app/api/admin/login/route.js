import mongoose from "mongoose";
import Admin from "../../../models/Admin";

export async function POST(req) {
  await mongoose.connect(process.env.MONGODB_URI);

  const { email, password } = await req.json();

  const admin = await Admin.findOne({ email });

  if (!admin) {
    return Response.json(
      { message: "Account does not exist" },
      { status: 404 }
    );
  }

  if (admin.password !== password) {
    return Response.json(
      { message: "Incorrect password" },
      { status: 401 }
    );
  }

  return Response.json({ success: true });
}
