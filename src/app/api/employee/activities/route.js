import { NextResponse } from "next/server";
import { requireEmployeeSession } from "@/server/auth/guards";
import {
  listEmployeeActivities,
  syncEmployeeActivities,
} from "@/server/repositories/employee-activity-repository";

export async function GET() {
  const session = await requireEmployeeSession();

  if (!session) {
    return NextResponse.json({ message: "Akses pegawai dibutuhkan." }, { status: 401 });
  }

  try {
    await syncEmployeeActivities(session.id);
    const activities = await listEmployeeActivities(session.id);
    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
