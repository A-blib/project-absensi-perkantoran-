import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { createAuthCookie } from "@/server/auth/session";
import { sanitizeText } from "@/lib/security/sanitize";
import { findUserByEmail } from "@/server/repositories/user-repository";
import { verifyPassword } from "@/server/services/password-service";

export async function POST(request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse({
    role: body.role,
    email: sanitizeText(body.email),
    password: body.password,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Pilih jenis akun, lalu isi email dan password dengan benar." },
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

    if (user.role !== parsed.data.role) {
      return NextResponse.json(
        {
          message:
            parsed.data.role === "admin"
              ? "Akun ini bukan admin. Pilih Karyawan atau gunakan akun admin."
              : "Akun ini bukan karyawan. Pilih Admin atau gunakan akun karyawan.",
        },
        { status: 403 },
      );
    }

    const redirectTo = user.role === "employee" ? "/employee" : "/admin";
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
