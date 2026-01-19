import { connectDB } from "../../../lib/db";
import Admin from "../../../models/Admin";
import bcrypt from "bcryptjs";



export async function POST(req) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { message: "Email & password required" },
        { status: 400 }
      );
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return Response.json(
        { message: "Admin already exists" },
        { status: 400 }
      );
    }

    // 🔐 HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      email,
      password: hashedPassword
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json(
      { message: "Register failed" },
      { status: 500 }
    );
  }
}
