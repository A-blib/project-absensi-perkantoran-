import { createSupabaseServerClient } from "@/server/db/client";

const activityColumns = `
  id,
  user_id,
  source_type,
  source_id,
  action,
  title,
  message,
  tone,
  occurred_at,
  deleted_at,
  created_at,
  updated_at
`;

function isMissingTable(error) {
  return (
    error?.message?.includes("Could not find the table") ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("does not exist")
  );
}

function formatTime(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function getDateRange(startDate, endDate) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return start === end ? start : `${start} - ${end}`;
}

function toActivity(row) {
  return {
    id: row.id,
    userId: row.user_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    action: row.action,
    title: row.title,
    message: row.message,
    tone: row.tone,
    occurredAt: row.occurred_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildAttendanceActivities(row) {
  const activities = [];
  const isLate = row.status === "telat";
  const location = row.location_label || "lokasi absensi";

  if (row.check_in_at) {
    const time = formatTime(row.check_in_at);
    activities.push({
      user_id: row.user_id,
      source_type: "attendance",
      source_id: row.id,
      action: "check_in",
      title: isLate ? "Terlambat masuk" : "Absensi masuk",
      message: isLate
        ? `Masuk pukul ${time} WIB, terlambat ${row.late_minutes || 0} menit.`
        : `Masuk pukul ${time} WIB di ${location}.`,
      tone: isLate ? "warning" : "emerald",
      occurred_at: row.check_in_at,
      updated_at: new Date().toISOString(),
    });
  }

  if (row.check_out_at) {
    activities.push({
      user_id: row.user_id,
      source_type: "attendance",
      source_id: row.id,
      action: "check_out",
      title: "Absensi keluar",
      message: `Keluar pukul ${formatTime(row.check_out_at)} WIB di ${location}.`,
      tone: "primary",
      occurred_at: row.check_out_at,
      updated_at: new Date().toISOString(),
    });
  }

  return activities;
}

function buildLeaveActivities(row) {
  const activities = [];
  const dateRange = getDateRange(row.start_date, row.end_date);

  if (row.submitted_at) {
    activities.push({
      user_id: row.user_id,
      source_type: "leave_request",
      source_id: row.id,
      action: "submitted",
      title: `Pengajuan ${row.type} dikirim`,
      message: `${row.type} tanggal ${dateRange} menunggu proses admin.`,
      tone: "violet",
      occurred_at: row.submitted_at,
      updated_at: new Date().toISOString(),
    });
  }

  if (row.decided_at && ["Disetujui", "Ditolak"].includes(row.status)) {
    const approved = row.status === "Disetujui";
    activities.push({
      user_id: row.user_id,
      source_type: "leave_request",
      source_id: row.id,
      action: `decision_${row.status.toLowerCase()}`,
      title: `Pengajuan ${row.type} ${row.status.toLowerCase()}`,
      message: `${row.type} tanggal ${dateRange} ${row.status.toLowerCase()} oleh admin.${row.admin_note ? ` Catatan: ${row.admin_note}` : ""}`,
      tone: approved ? "emerald" : "danger",
      occurred_at: row.decided_at,
      updated_at: new Date().toISOString(),
    });
  }

  return activities;
}

export async function syncEmployeeActivities(userId) {
  const supabase = createSupabaseServerClient();
  const [attendanceResult, leaveResult] = await Promise.all([
    supabase
      .from("attendances")
      .select("id, user_id, check_in_at, check_out_at, status, late_minutes, location_label")
      .eq("user_id", userId),
    supabase
      .from("leave_requests")
      .select("id, user_id, type, start_date, end_date, status, admin_note, submitted_at, decided_at")
      .eq("user_id", userId),
  ]);

  if (attendanceResult.error) {
    throw new Error(`Gagal menyinkronkan aktivitas absensi: ${attendanceResult.error.message}`);
  }

  if (leaveResult.error) {
    throw new Error(`Gagal menyinkronkan aktivitas izin: ${leaveResult.error.message}`);
  }

  const activities = [
    ...attendanceResult.data.flatMap(buildAttendanceActivities),
    ...leaveResult.data.flatMap(buildLeaveActivities),
  ];

  if (!activities.length) return;

  const { error } = await supabase
    .from("employee_activities")
    .upsert(activities, {
      onConflict: "user_id,source_type,source_id,action",
    });

  if (isMissingTable(error)) return;

  if (error) {
    throw new Error(`Gagal menyimpan aktivitas terbaru: ${error.message}`);
  }
}

export async function listEmployeeActivities(userId) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("employee_activities")
    .select(activityColumns)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false })
    .limit(50);

  if (isMissingTable(error)) return [];

  if (error) {
    throw new Error(`Gagal mengambil aktivitas terbaru: ${error.message}`);
  }

  return data.map(toActivity);
}

export async function deleteEmployeeActivity(userId, id) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("employee_activities")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select(activityColumns)
    .maybeSingle();

  if (isMissingTable(error)) return null;

  if (error) {
    throw new Error(`Gagal menghapus aktivitas: ${error.message}`);
  }

  return data ? toActivity(data) : null;
}
