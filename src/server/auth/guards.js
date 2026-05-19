import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/server/auth/constants";
import { verifySessionToken } from "@/server/auth/session";

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return verifySessionToken(token);
}

export async function requireAdminSession() {
  const session = await getCurrentSession();

  if (!session || session.role !== "admin") {
    return null;
  }

  return session;
}
