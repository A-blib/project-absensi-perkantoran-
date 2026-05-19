import { NextResponse } from "next/server";
import { positionSchema } from "@/lib/validations/positions";
import { requireAdminSession } from "@/server/auth/guards";
import {
  createPosition,
  listPositions,
} from "@/server/repositories/position-repository";

export async function GET() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  try {
    const positions = await listPositions();
    return NextResponse.json({ positions });
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
  const parsed = positionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Data jabatan tidak valid." }, { status: 422 });
  }

  try {
    const position = await createPosition(parsed.data);
    return NextResponse.json({ position }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
