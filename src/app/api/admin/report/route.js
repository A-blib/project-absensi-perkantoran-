import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { getAttendanceReport } from "@/server/repositories/attendance-repository";

export async function GET(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  try {
    const rows = await getAttendanceReport({ startDate, endDate });
    return NextResponse.json({ rows });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
