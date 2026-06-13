import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/server/auth/constants";
import { verifySessionToken } from "@/server/auth/session";
import { findUserById } from "@/server/repositories/user-repository";

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return verifySessionToken(token);
}

async function getVerifiedSessionUser() {
  const session = await getCurrentSession();

  if (!session?.id) return null;

  const user = await findUserById(session.id);

  if (!user || user.status !== "active") return null;

  return toSafeSessionUser(user);
}

export async function requireAdminSession() {
  try {
    const user = await getVerifiedSessionUser();
    return user?.role === "admin" ? user : null;
  } catch {
    return null;
  }
}

export async function requireEmployeeSession() {
  try {
    const user = await getVerifiedSessionUser();
    return user?.role === "employee" ? user : null;
  } catch {
    return null;
  }
}

export function toSafeSessionUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    division: user.division,
    position: user.position,
    phone: user.phone,
    employeeCode: user.employeeCode,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    photoUrl: user.photoUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getCurrentUser() {
  try {
    return await getVerifiedSessionUser();
  } catch {
    return null;
  }
}
