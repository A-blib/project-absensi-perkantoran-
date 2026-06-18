import { NextResponse } from "next/server";
import { updateDivisionSchema } from "@/lib/validations/divisions";
import { requireAdminSession } from "@/server/auth/guards";
import {
  deleteDivision,
  updateDivision,
} from "@/server/repositories/division-repository";

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateDivisionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Data divisi tidak valid." }, { status: 422 });
  }

  try {
    const division = await updateDivision(id, parsed.data);
    return NextResponse.json({ division });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteDivision(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
