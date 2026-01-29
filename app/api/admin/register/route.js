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

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.trim().toLowerCase();

    // Check if admin exists (case-insensitive)
    const exists = await Admin.findOne({ 
      $or: [
        { email: normalizedEmail },
        { email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } }
      ]
    });
    if (exists) {
      return Response.json(
        { message: "Admin already exists" },
        { status: 400 }
      );
    }

    // 🔐 HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      email: normalizedEmail, // Store lowercase for consistency
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
