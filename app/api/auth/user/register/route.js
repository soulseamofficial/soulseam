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

    if (!name) {
      return NextResponse.json(
        { error: "Name required" },
        { status: 400 }
      );
    }
    
    // Require at least one: phone OR email
    if (!phone && !email) {
      return NextResponse.json(
        { error: "Email or Phone is required" },
        { status: 400 }
      );
    }

    // Validate email only if provided
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    // Validate phone only if provided
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Valid phone required" },
        { status: 400 }
      );
    }

    // Password is required for all registrations
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Uniqueness check: Check for existing user with same email or phone
    const existingQuery = email && phone 
      ? { $or: [{ email }, { phone }] }
      : email 
      ? { email }
      : { phone };
    
    const existing = await User.findOne(existingQuery).lean();
    if (existing) {
      return NextResponse.json(
        { error: "Email or phone already registered" },
        { status: 409 }
      );
    }

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
            phone: phone || "", // Phone is optional in address
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

    // Build user object - only include fields that are provided
    const userData = {
      name,
      provider: "local",
      addresses,
      isVerified: false, // Verification will be added later
    };

    // Determine loginMethod based on what's provided
    if (email && phone) {
      // Both provided - use email as primary login method
      userData.loginMethod = "email";
      userData.email = email;
      userData.phone = phone;
      userData.emailVerified = false;
      userData.isPhoneVerified = false;
    } else if (email) {
      // Email only
      userData.loginMethod = "email";
      userData.email = email;
      userData.emailVerified = false;
    } else if (phone) {
      // Phone only
      userData.loginMethod = "phone";
      userData.phone = phone;
      userData.isPhoneVerified = false;
    }

    // Hash password using bcrypt with salt rounds 10
    userData.passwordHash = await bcrypt.hash(password, 10);

    try {
      const user = await User.create(userData);

      const token = signUserToken({ userId: user._id.toString() });
      const res = NextResponse.json({ success: true });
      setUserAuthCookie(res, token);
      return res;
    } catch (createError) {
      // Handle Mongoose validation errors
      if (createError.name === 'ValidationError') {
        const errorMessage = createError.message || 'Validation failed';
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
      
      // Handle duplicate key errors (email or phone already exists)
      if (createError.code === 11000) {
        const field = createError.keyPattern?.email ? 'email' : 'phone';
        return NextResponse.json(
          { error: `${field === 'email' ? 'Email' : 'Phone'} already registered` },
          { status: 409 }
        );
      }
      
      // Re-throw to outer catch
      throw createError;
    }
  } catch (error) {
    console.error("Registration error:", error);
    
    // Always return a proper response, never throw
    return NextResponse.json(
      { 
        error: error.message || "Registration failed. Please try again." 
      },
      { status: 500 }
    );
  }
}

