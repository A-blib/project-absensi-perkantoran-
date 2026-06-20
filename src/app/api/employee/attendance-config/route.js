import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/guards";
import { getSystemSettings } from "@/server/repositories/settings-repository";
import { findShiftById } from "@/server/repositories/shift-repository";
import { findUserById } from "@/server/repositories/user-repository";

export async function GET() {
  const session = await getCurrentSession();

  if (!session?.id) {
    return NextResponse.json({ message: "Login dibutuhkan." }, { status: 401 });
  }

  try {
    // Baca user langsung dari DB agar shiftId selalu terbaru
    const [settings, dbUser] = await Promise.all([
      getSystemSettings(),
      findUserById(session.id),
    ]);

    if (!dbUser || !["admin", "employee"].includes(dbUser.role)) {
      return NextResponse.json({ message: "Login dibutuhkan." }, { status: 401 });
    }

    const userShift = dbUser.shiftId ? await findShiftById(dbUser.shiftId) : null;

    const workHours = userShift
      ? {
          ...settings.workHours,
          startTime: userShift.startTime,
          endTime: userShift.endTime,
          shiftName: userShift.name,
          shiftId: userShift.id,
        }
      : settings.workHours;

    return NextResponse.json({
      config: {
        workHours,
        location: settings.location,
        attendanceRules: settings.attendanceRules,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
