import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { listLeaveRequests } from "@/server/repositories/leave-repository";

export async function GET() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  try {
    const requests = await listLeaveRequests();
    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
