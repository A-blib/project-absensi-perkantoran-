import { NextResponse } from "next/server";
import { changePasswordSchema } from "@/lib/validations/users";
import { getCurrentSession } from "@/server/auth/guards";
import { findUserById, updatePasswordHash } from "@/server/repositories/user-repository";
import { hashPassword, verifyPassword } from "@/server/services/password-service";

export async function POST(request) {
  const session = await getCurrentSession();

  if (!session?.id) {
    return NextResponse.json({ message: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Password tidak valid." }, { status: 422 });
  }

  const user = await findUserById(session.id);
  const isCurrentPasswordValid = user
    ? await verifyPassword(parsed.data.currentPassword, user.password_hash)
    : false;

  if (!user || !isCurrentPasswordValid) {
    return NextResponse.json({ message: "Password saat ini salah." }, { status: 401 });
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await updatePasswordHash(user.id, passwordHash, false);

  return NextResponse.json({
    redirectTo: user.role === "employee" ? "/employee" : "/admin",
  });
}
