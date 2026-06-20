import { NextResponse } from "next/server";
import { updateShiftSchema } from "@/lib/validations/shifts";
import { requireAdminSession } from "@/server/auth/guards";
import {
  deleteShift,
  updateShift,
} from "@/server/repositories/shift-repository";

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateShiftSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Data shift tidak valid." }, { status: 422 });
  }

  try {
    const shift = await updateShift(id, parsed.data);
    return NextResponse.json({ shift });
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
    await deleteShift(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
