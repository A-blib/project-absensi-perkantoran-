import { NextResponse } from "next/server";
import { leaveRequestSchema } from "@/lib/validations/leave";
import { requireEmployeeSession } from "@/server/auth/guards";
import {
  createLeaveRequest,
  listLeaveRequests,
} from "@/server/repositories/leave-repository";

export async function GET() {
  const session = await requireEmployeeSession();

  if (!session) {
    return NextResponse.json({ message: "Akses pegawai dibutuhkan." }, { status: 401 });
  }

  try {
    const requests = await listLeaveRequests({ userId: session.id });
    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireEmployeeSession();

  if (!session) {
    return NextResponse.json({ message: "Akses pegawai dibutuhkan." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = leaveRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Data pengajuan tidak valid." }, { status: 422 });
  }

  try {
    const leaveRequest = await createLeaveRequest(session.id, parsed.data);
    return NextResponse.json({ request: leaveRequest }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
