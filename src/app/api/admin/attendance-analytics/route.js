import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { getAttendanceAnalyticsData } from "@/server/repositories/attendance-repository";

export async function GET(request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = ["weekly", "monthly", "yearly"].includes(searchParams.get("period"))
    ? searchParams.get("period")
    : "monthly";

  try {
    const data = await getAttendanceAnalyticsData(period);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
