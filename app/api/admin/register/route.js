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

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: normalizedEmail });
    if (existingAdmin) {
      console.error(`[Admin Register] Admin already exists for email: ${normalizedEmail}`);
      return Response.json(
        { message: "Admin already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = await Admin.create({
      email: normalizedEmail,
      password: hashedPassword
    });

    console.log(`[Admin Register] New admin created with email: ${normalizedEmail}`);
    return Response.json({ success: true, adminId: newAdmin._id });
  } catch (err) {
    console.error("[Admin Register] Database error:", err);
    return Response.json(
      { message: "Register failed" },
      { status: 500 }
    );
  }
}
