import { SignJWT, jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/server/auth/constants";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || "development-secret-change-me";
  return new TextEncoder().encode(secret);
}

function getMidnightExpiry() {
  const expires = new Date();
  expires.setHours(24, 0, 0, 0);
  return expires;
}

export async function createAuthCookie(payload) {
  const expires = getMidnightExpiry();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Math.floor(expires.getTime() / 1000))
    .sign(getJwtSecret());

  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  };
}

export async function verifySessionToken(token) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload;
  } catch {
    return null;
  }
}
