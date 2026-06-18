import { NextResponse } from "next/server";
import { createUserSchema } from "@/lib/validations/users";
import { requireAdminSession } from "@/server/auth/guards";
import { createUser, listUsers } from "@/server/repositories/user-repository";

export async function GET() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  try {
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Data pegawai tidak valid." }, { status: 422 });
  }

  try {
    const user = await createUser(parsed.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
