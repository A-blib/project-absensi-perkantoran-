import { NextResponse } from "next/server";
import { updatePositionSchema } from "@/lib/validations/positions";
import { requireAdminSession } from "@/server/auth/guards";
import {
  deletePosition,
  updatePosition,
} from "@/server/repositories/position-repository";

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updatePositionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Data jabatan tidak valid." }, { status: 422 });
  }

  try {
    const position = await updatePosition(id, parsed.data);
    return NextResponse.json({ position });
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
    await deletePosition(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
