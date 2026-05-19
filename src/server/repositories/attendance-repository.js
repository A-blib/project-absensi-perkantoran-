import { demoAttendanceRows } from "@/features/reports/report-data";
import { createSupabaseServerClient } from "@/server/db/client";

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export async function getAttendanceRecap() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return demoAttendanceRows;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("attendances")
    .select(
      `
        id,
        attendance_date,
        check_in_at,
        check_out_at,
        status,
        late_minutes,
        location_label,
        users (
          name,
          division
        )
      `,
    )
    .order("attendance_date", { ascending: false })
    .order("check_in_at", { ascending: false });

  if (error) {
    throw new Error(`Gagal mengambil rekap absensi: ${error.message}`);
  }

  return data.map((row) => ({
    id: row.id,
    name: row.users?.name || "-",
    division: row.users?.division || "-",
    date: formatDate(row.attendance_date),
    checkIn: formatTime(row.check_in_at),
    checkOut: formatTime(row.check_out_at),
    status: row.status,
    lateMinutes: row.late_minutes || 0,
    location: row.location_label || "-",
  }));
}
