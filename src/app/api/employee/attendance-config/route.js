import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/guards";
import { getSystemSettings } from "@/server/repositories/settings-repository";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || !["admin", "employee"].includes(user.role)) {
    return NextResponse.json({ message: "Login dibutuhkan." }, { status: 401 });
  }

  try {
    const settings = await getSystemSettings();

    return NextResponse.json({
      config: {
        workHours: settings.workHours,
        location: settings.location,
        attendanceRules: settings.attendanceRules,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
