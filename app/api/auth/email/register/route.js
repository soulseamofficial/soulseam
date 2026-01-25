import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../../lib/firebase";
import { connectDB } from "../../../../lib/db";
import User from "../../../../models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await connectDB();

    await User.create({
      email,
      firebaseUid: userCredential.user.uid,
      role: "user",
      provider: "email",
    });

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}
