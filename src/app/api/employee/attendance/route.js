import { NextResponse } from "next/server";
import { requireEmployeeSession } from "@/server/auth/guards";
import {
  getEmployeeAttendanceToday,
  listEmployeeAttendance,
  upsertEmployeeAttendance,
} from "@/server/repositories/attendance-repository";
import { getSystemSettings } from "@/server/repositories/settings-repository";

function isValidAttendancePayload(value) {
  return (
    value &&
    ["masuk", "keluar"].includes(value.type) &&
    typeof value.capturedAt === "string" &&
    typeof value.dateKey === "string" &&
    typeof value.latitude === "string" &&
    typeof value.longitude === "string" &&
    Number.isFinite(Number(value.latitude)) &&
    Number.isFinite(Number(value.longitude))
  );
}

function getMinutesFromTime(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function getJakartaTime(value) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function getServerAttendanceStatus(capturedAt, workHours) {
  const capturedMinutes = getMinutesFromTime(getJakartaTime(capturedAt));
  const targetMinutes =
    getMinutesFromTime(workHours.startTime) + Number(workHours.lateTolerance || 0);
  const lateMinutes = Math.max(0, capturedMinutes - targetMinutes);

  return {
    status: lateMinutes > 0 ? "telat" : "hadir",
    lateMinutes,
  };
}

export async function GET() {
  const session = await requireEmployeeSession();

  if (!session) {
    return NextResponse.json({ message: "Akses pegawai dibutuhkan." }, { status: 401 });
  }

  try {
    const [records, today] = await Promise.all([
      listEmployeeAttendance(session.id),
      getEmployeeAttendanceToday(session.id),
    ]);

    return NextResponse.json({ records, today });
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

  if (!isValidAttendancePayload(body)) {
    return NextResponse.json({ message: "Data absensi tidak valid." }, { status: 422 });
  }

  try {
    const settings = await getSystemSettings();
    const currentToday = await getEmployeeAttendanceToday(session.id);
    const serverPayload = {
      ...body,
      location: settings.location.name,
      currentLocationLabel: body.currentLocationLabel,
      status: "hadir",
      lateMinutes: 0,
    };

    if (body.type === "masuk") {
      if (currentToday?.clockIn && currentToday.clockIn !== "-") {
        return NextResponse.json(
          { message: "Absensi masuk hari ini sudah tercatat." },
          { status: 409 },
        );
      }

      const serverStatus = getServerAttendanceStatus(
        body.capturedAt,
        settings.workHours,
      );
      serverPayload.status = serverStatus.status;
      serverPayload.lateMinutes = serverStatus.lateMinutes;
    }

    if (body.type === "keluar") {
      if (!currentToday?.clockIn || currentToday.clockIn === "-") {
        return NextResponse.json(
          { message: "Absensi masuk belum tercatat." },
          { status: 422 },
        );
      }

      if (currentToday?.clockOut && currentToday.clockOut !== "--:--:--") {
        return NextResponse.json(
          { message: "Absensi keluar hari ini sudah tercatat." },
          { status: 409 },
        );
      }

      serverPayload.status = currentToday.statusKey || "hadir";
      serverPayload.lateMinutes = currentToday.lateMinutes || 0;
    }

    const record = await upsertEmployeeAttendance(session.id, serverPayload);
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
