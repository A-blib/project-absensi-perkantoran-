import { NextResponse } from "next/server";
import { requireEmployeeSession } from "@/server/auth/guards";
import { deleteEmployeeActivity } from "@/server/repositories/employee-activity-repository";

export async function DELETE(_request, { params }) {
  const session = await requireEmployeeSession();

  if (!session) {
    return NextResponse.json({ message: "Akses pegawai dibutuhkan." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const activity = await deleteEmployeeActivity(session.id, id);

    if (!activity) {
      return NextResponse.json(
        { message: "Aktivitas tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ activity });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
