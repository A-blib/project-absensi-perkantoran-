import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/server/auth/guards";
import { createAttendanceByAdmin } from "@/server/repositories/attendance-repository";

const attendanceAdminCreateSchema = z.object({
  userId: z.string().uuid(),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkIn: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  checkOut: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  status: z.enum(["hadir", "telat", "izin", "alpa"]),
  lateMinutes: z.coerce.number().int().min(0).max(1440).default(0),
  location: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function POST(request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = attendanceAdminCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Data absensi tidak valid." }, { status: 422 });
  }

  try {
    const attendance = await createAttendanceByAdmin(parsed.data);
    return NextResponse.json({ attendance }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
