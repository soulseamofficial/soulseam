import { NextResponse } from "next/server";
import { auth } from "../../../../lib/firebase";
import { sendEmailVerification } from "firebase/auth";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(email)) {
      return NextResponse.json(
        { message: "Valid email address required" },
        { status: 400 }
      );
    }

    // Note: This endpoint requires the user to be authenticated
    // The verification email is sent after account creation in the register flow
    // This is a helper endpoint that can be called if needed
    
    return NextResponse.json(
      { message: "Verification email will be sent after account creation" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to send verification email" },
      { status: 500 }
    );
  }
}
