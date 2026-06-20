import { NextResponse } from "next/server";
import { shiftSchema } from "@/lib/validations/shifts";
import { requireAdminSession } from "@/server/auth/guards";
import { createShift, listShifts } from "@/server/repositories/shift-repository";

export async function GET() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  try {
    const shifts = await listShifts();
    return NextResponse.json({ shifts });
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
  const parsed = shiftSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Data shift tidak valid." }, { status: 422 });
  }

  try {
    const shift = await createShift(parsed.data);
    return NextResponse.json({ shift }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
