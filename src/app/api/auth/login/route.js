import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { createAuthCookie } from "@/server/auth/session";
import { sanitizeText } from "@/lib/security/sanitize";
import { findUserByEmail } from "@/server/repositories/user-repository";
import { verifyPassword } from "@/server/services/password-service";

const demoUsers = [
  {
    id: "demo-admin",
    name: "Admin HR",
    email: "admin@kantor.test",
    password: "admin123",
    role: "admin",
    status: "active",
    mustChangePassword: false,
  },
  {
    id: "demo-employee",
    name: "Rina Pratiwi",
    email: "pegawai@kantor.test",
    password: "pegawai123",
    role: "employee",
    status: "active",
    mustChangePassword: false,
  },
];

function findDemoUser(email, password) {
  const user = demoUsers.find((item) => item.email === email);

  if (!user || user.password !== password) {
    return null;
  }

  return user;
}

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

  let user;

  try {
    user = await findUserByEmail(parsed.data.email);
  } catch {
    user = findDemoUser(parsed.data.email, parsed.data.password);

    if (!user) {
      return NextResponse.json(
        {
          message:
            "Supabase belum terhubung. Gunakan akun demo yang tersedia atau lengkapi env Supabase.",
        },
        { status: 503 },
      );
    }
  }

  const isDemoUser = "password" in user;
  const isValidPassword = isDemoUser
    ? true
    : user
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
      name: user.name,
      email: user.email,
      mustChangePassword: user.mustChangePassword,
    }),
  );
  return response;
}
