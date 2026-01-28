import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectDB } from "./db";
import User from "../models/User";

const COOKIE_NAME = "user_token";

export function signUserToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");
  return jwt.sign(payload, secret, { expiresIn: "30d" });
}

export function verifyUserToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");
  return jwt.verify(token, secret);
}

export async function getAuthUserFromCookies() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  let decoded;
  try {
    decoded = verifyUserToken(token);
  } catch {
    return null;
  }
  if (!decoded?.userId) return null;
  await connectDB();
  const user = await User.findById(decoded.userId).lean();
  return user || null;
}

export function setUserAuthCookie(res, token) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearUserAuthCookie(res) {
  res.cookies.delete(COOKIE_NAME);
}

