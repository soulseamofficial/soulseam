import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import { setUserAuthCookie, signUserToken } from "@/app/lib/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/lib/firebase";

function isEmail(identifier) {
  return typeof identifier === "string" && identifier.includes("@");
}

export async function POST(req) {
  try {
    await connectDB();
    const { identifier, password } = await req.json();

    const id = typeof identifier === "string" ? identifier.trim().toLowerCase() : "";
    const pw = typeof password === "string" ? password : "";

    if (!id || !pw) {
      return NextResponse.json(
        { error: "Identifier and password required" },
        { status: 400 }
      );
    }

    if (isEmail(id)) {
      // Email login - use Firebase
      try {
        const userCredential = await signInWithEmailAndPassword(auth, id, pw);
        
        // Check if email is verified in Firebase
        if (!userCredential.user.emailVerified) {
          return NextResponse.json(
            { error: "Please verify your email before logging in." },
            { status: 403 }
          );
        }

        // Find user in MongoDB
        const user = await User.findOne({ email: id }).lean();
        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        // Also check emailVerified in MongoDB (for consistency)
        if (user.loginMethod === "email" && !user.emailVerified) {
          // Update MongoDB to reflect Firebase verification status
          await User.updateOne(
            { _id: user._id },
            { $set: { emailVerified: true } }
          );
        }

        const token = signUserToken({ userId: user._id.toString() });
        const res = NextResponse.json({ success: true });
        setUserAuthCookie(res, token);
        return res;
      } catch (firebaseError) {
        console.error("Firebase login error:", firebaseError);
        let errorMessage = "Invalid credentials";
        if (firebaseError.code === "auth/user-not-found" || firebaseError.code === "auth/wrong-password") {
          errorMessage = "Invalid email or password";
        } else if (firebaseError.code === "auth/invalid-email") {
          errorMessage = "Invalid email address";
        } else if (firebaseError.message) {
          errorMessage = firebaseError.message;
        }
        return NextResponse.json(
          { error: errorMessage },
          { status: 401 }
        );
      }
    } else {
      // Phone login - use MongoDB (unchanged)
      const query = { phone: id.replace(/\D/g, "").slice(0, 10) };
      const user = await User.findOne(query).select("+passwordHash").lean();
      if (!user?.passwordHash) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const ok = await bcrypt.compare(pw, user.passwordHash);
      if (!ok) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const token = signUserToken({ userId: user._id.toString() });
      const res = NextResponse.json({ success: true });
      setUserAuthCookie(res, token);
      return res;
    }
  } catch (error) {
    console.error("Login error:", error);
    // Always return a proper response, never throw
    return NextResponse.json(
      { error: error.message || "Login failed. Please try again." },
      { status: 500 }
    );
  }
}

