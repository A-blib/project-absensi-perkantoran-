import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { createAuthCookie } from "@/server/auth/session";
import { sanitizeText } from "@/lib/security/sanitize";
import { findUserByEmail } from "@/server/repositories/user-repository";
import { verifyPassword } from "@/server/services/password-service";

export async function POST(request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse({
    email: sanitizeText(body.email),
    password: body.password,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Email atau password tidak valid." },
      { status: 422 },
    );
  }

  try {
    const user = await findUserByEmail(parsed.data.email);
    const isValidPassword = user
      ? await verifyPassword(parsed.data.password, user.password_hash)
      : false;

    if (!user || !isValidPassword) {
      return NextResponse.json(
        { message: "Email atau password salah." },
        { status: 401 },
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { message: "Akun ini nonaktif. Hubungi admin HR." },
        { status: 403 },
      );
    }

    const redirectTo = user.mustChangePassword
      ? "/change-password"
      : user.role === "employee"
        ? "/employee"
        : "/admin";
    const response = NextResponse.json({ redirectTo });

    response.cookies.set(
      createAuthCookie({
        id: user.id,
        role: user.role,
      }),
    );
    return response;
  } catch {
    return NextResponse.json(
      {
        message:
          "Login hanya bisa memakai akun yang terdaftar di menu Pegawai. Pastikan Supabase aktif dan data pegawai sudah dibuat.",
      },
      { status: 503 },
    );
  }
}
