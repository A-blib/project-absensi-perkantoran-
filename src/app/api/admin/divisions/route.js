import { NextResponse } from "next/server";
import { divisionSchema } from "@/lib/validations/divisions";
import { requireAdminSession } from "@/server/auth/guards";
import {
  createDivision,
  listDivisions,
} from "@/server/repositories/division-repository";

export async function GET() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  try {
    const divisions = await listDivisions();
    return NextResponse.json({ divisions });
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
  const parsed = divisionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Data divisi tidak valid." }, { status: 422 });
  }

  try {
    const division = await createDivision(parsed.data);
    return NextResponse.json({ division }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
