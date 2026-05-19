import jwt from "jsonwebtoken";
import { SESSION_COOKIE } from "@/server/auth/constants";

function getJwtSecret() {
  return process.env.JWT_SECRET || "development-secret-change-me";
}

function getMidnightExpiry() {
  const expires = new Date();
  expires.setHours(24, 0, 0, 0);
  return expires;
}

export function createAuthCookie(payload) {
  const expires = getMidnightExpiry();
  const token = jwt.sign(
    {
      ...payload,
      exp: Math.floor(expires.getTime() / 1000),
    },
    getJwtSecret(),
  );

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

export function verifySessionToken(token) {
  if (!token) return null;

  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}
