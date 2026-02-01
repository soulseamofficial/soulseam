import { createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "../../../../lib/firebase";
import { connectDB } from "../../../../lib/db";
import User from "../../../../models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email address required" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Bonus: Check if email already has sign-in methods before attempting creation
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
      if (signInMethods && signInMethods.length > 0) {
        return NextResponse.json(
          { 
            error: "User already exists. Please login."
          },
          { status: 400 }
        );
      }
    } catch (checkError) {
      // If check fails, continue with registration attempt
      // (some Firebase configs may not support this method)
      console.log("Sign-in methods check skipped:", checkError.message);
    }

    // Check if user already exists in MongoDB
    await connectDB();
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return NextResponse.json(
        { 
          error: "User already exists. Please login."
        },
        { status: 400 }
      );
    }

    // Create Firebase user - wrapped in try-catch for proper error handling
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );
    } catch (error) {
      // Handle Firebase errors specifically
      if (error.code === 'auth/email-already-in-use') {
        return NextResponse.json(
          {
            error: "User already exists. Please login."
          },
          { status: 400 }
        );
      }

      // Handle other Firebase errors
      let errorMessage = "Registration failed. Try again.";
      let statusCode = 500;
      
      if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
        statusCode = 400; // Client validation error
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
        statusCode = 400; // Client validation error
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Email/password accounts are not enabled";
        statusCode = 500; // Server configuration error
      } else if (error.message) {
        errorMessage = error.message;
      }

      return NextResponse.json(
        {
          error: errorMessage
        },
        { status: statusCode }
      );
    }

    // Send email verification
    try {
      await sendEmailVerification(userCredential.user);
    } catch (verifyError) {
      console.error("Failed to send verification email:", verifyError);
      // Continue even if verification email fails
    }

    return NextResponse.json(
      { 
        success: true,
        message: "User registered successfully",
        uid: userCredential.user.uid,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    // Always return a proper response, never throw
    return NextResponse.json(
      {
        error: error.message || "Registration failed. Try again."
      },
      { status: 500 }
    );
  }
}
