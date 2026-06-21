import { NextResponse } from "next/server";
import { leaveDecisionSchema } from "@/lib/validations/leave";
import { requireAdminSession } from "@/server/auth/guards";
import { decideLeaveRequest } from "@/server/repositories/leave-repository";
import { syncEmployeeActivities } from "@/server/repositories/employee-activity-repository";

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = leaveDecisionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Keputusan tidak valid." }, { status: 422 });
  }

  try {
    const { id } = await params;
    const leaveRequest = await decideLeaveRequest(id, parsed.data, session.id);

    // Rekam aktivitas approve/reject ke employee_activities
    syncEmployeeActivities(leaveRequest.userId).catch(() => {});

    return NextResponse.json({ request: leaveRequest });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
