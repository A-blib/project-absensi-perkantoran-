import { demoAttendanceRows } from "@/features/reports/report-data";
import { createSupabaseServerClient } from "@/server/db/client";
import { getSystemSettings } from "@/server/repositories/settings-repository";

const attendanceColumns = `
  id,
  user_id,
  attendance_date,
  check_in_at,
  check_out_at,
  status,
  late_minutes,
  photo_url,
  latitude,
  longitude,
  location_label,
  created_at,
  users (
    name,
    division,
    position
  )
`;

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatShortDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function normalizeAttendanceStatus(value) {
  if (value === "Terlambat") return "telat";
  if (value === "Izin") return "izin";
  if (value === "Alpa") return "alpa";
  return value === "telat" || value === "izin" || value === "alpa" ? value : "hadir";
}

function toEmployeeAttendance(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    employeeName: row.users?.name || "Pegawai",
    division: row.users?.division || "-",
    position: row.users?.position || "-",
    date: formatShortDate(row.attendance_date),
    dateKey: row.attendance_date,
    clockIn: formatTime(row.check_in_at),
    clockOut: row.check_out_at ? formatTime(row.check_out_at) : "--:--:--",
    status: row.status === "telat" ? "Terlambat" : "Hadir",
    statusKey: row.status,
    lateMinutes: row.late_minutes || 0,
    location: row.location_label || "-",
    latitude: row.latitude,
    longitude: row.longitude,
    currentLocationLabel: row.current_location_label || "",
    photo: row.photo_url,
    outPhoto: null,
    savedAt: row.created_at ? formatDateTime(row.created_at) : "",
    faceVerified: true,
    faceConfidence: 98,
  };
}

function formatDateTime(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function getJakartaDateKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  return formatter.format(date);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getJakartaDateFromKey(dateKey) {
  return new Date(`${dateKey}T00:00:00+07:00`);
}

function getDayName(dateKey) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    timeZone: "Asia/Jakarta",
  }).format(getJakartaDateFromKey(dateKey));
}

function getShortDayDate(dateKey) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(getJakartaDateFromKey(dateKey));
}

function getLastDateKeys(totalDays = 7) {
  const today = getJakartaDateFromKey(getJakartaDateKey());

  return Array.from({ length: totalDays }, (_, index) =>
    getJakartaDateKey(addDays(today, index - totalDays + 1)),
  );
}

function getMinutesFromTime(value) {
  if (!value || value === "-") return null;

  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  return hour * 60 + minute;
}

function getOvertimeMinutes(checkOut, workHours) {
  const checkOutMinutes = getMinutesFromTime(checkOut);
  const endMinutes = getMinutesFromTime(workHours.endTime);

  if (checkOutMinutes === null || endMinutes === null) return 0;

  return Math.max(0, checkOutMinutes - endMinutes);
}

function formatCoordinate(latitude, longitude) {
  if (!latitude || !longitude) return "-";

  return `${latitude}, ${longitude}`;
}

function formatCurrentLocation(row) {
  const coordinates = formatCoordinate(row.latitude, row.longitude);
  const label = row.current_location_label;

  if (label && coordinates !== "-") return `${label} (${coordinates})`;
  return label || coordinates;
}

function formatTargetLocation(settings, selectedLocationName) {
  const coordinates = formatCoordinate(
    settings.location.latitude,
    settings.location.longitude,
  );
  const locationName = selectedLocationName || settings.location.name;

  return coordinates === "-"
    ? locationName
    : `${locationName} (${coordinates})`;
}

function getDisplayCheckIn(row, settings) {
  const actual = formatTime(row.check_in_at);
  return actual === "-" ? settings.workHours.startTime : actual;
}

function getDisplayCheckOut(row, settings) {
  const actual = formatTime(row.check_out_at);
  return actual === "-" ? settings.workHours.endTime : actual;
}

function toRecapRow(row, settings) {
  const checkIn = getDisplayCheckIn(row, settings);
  const checkOut = getDisplayCheckOut(row, settings);

  return {
    id: row.id,
    userId: row.user_id,
    name: row.users?.name || "-",
    division: row.users?.division || "-",
    date: formatDate(row.attendance_date),
    dateKey: row.attendance_date,
    checkIn,
    checkOut,
    status: row.status,
    lateMinutes: row.late_minutes || 0,
    overtimeMinutes: getOvertimeMinutes(checkOut, settings.workHours),
    location: row.location_label || "-",
    currentLocation: formatCurrentLocation(row),
    targetLocation: formatTargetLocation(settings, row.location_label),
    isGenerated: false,
  };
}

function toGeneratedAlpaRow(user, dateKey, settings) {
  return {
    id: `missing-${user.id}-${dateKey}`,
    userId: user.id,
    name: user.name || "-",
    division: user.division || "-",
    date: formatDate(dateKey),
    dateKey,
    checkIn: settings.workHours.startTime,
    checkOut: settings.workHours.endTime,
    status: "alpa",
    lateMinutes: 0,
    overtimeMinutes: 0,
    location: "-",
    currentLocation: "-",
    targetLocation: formatTargetLocation(settings, settings.location.name),
    isGenerated: true,
  };
}

function buildWeeklyAttendanceData(rows, totalEmployees, settings) {
  const dateKeys = getLastDateKeys();
  const workDays = new Set(settings.workHours.workDays || []);
  const countByDate = new Map(
    dateKeys.map((dateKey) => [
      dateKey,
      { hadir: 0, telat: 0, izin: 0, alpa: 0 },
    ]),
  );

  rows.forEach((row) => {
    const counts = countByDate.get(row.attendance_date);
    if (!counts || !(row.status in counts)) return;
    counts[row.status] += 1;
  });

  const counts = dateKeys.map((dateKey) => {
    const current = countByDate.get(dateKey);
    const recorded = current.hadir + current.telat + current.izin;
    const isWorkDay = workDays.size ? workDays.has(getDayName(dateKey)) : true;

    return {
      ...current,
      alpa: isWorkDay ? Math.max(totalEmployees - recorded, current.alpa) : current.alpa,
    };
  });

  return {
    labels: dateKeys.map(getShortDayDate),
    datasets: [
      {
        label: "Hadir",
        data: counts.map((item) => item.hadir),
        backgroundColor: "#16a34a",
        borderRadius: 6,
      },
      {
        label: "Telat",
        data: counts.map((item) => item.telat),
        backgroundColor: "#f59e0b",
        borderRadius: 6,
      },
      {
        label: "Izin/Cuti",
        data: counts.map((item) => item.izin),
        backgroundColor: "#06b6d4",
        borderRadius: 6,
      },
      {
        label: "Alpa",
        data: counts.map((item) => item.alpa),
        backgroundColor: "#ef4444",
        borderRadius: 6,
      },
    ],
  };
}

export async function getAttendanceRecap() {
  if (!hasSupabaseEnv()) {
    return demoAttendanceRows;
  }

  const supabase = createSupabaseServerClient();
  const today = getJakartaDateKey();
  const [settings, attendanceResult, usersResult] = await Promise.all([
    getSystemSettings(),
    supabase
      .from("attendances")
      .select(
        `
          id,
          user_id,
          attendance_date,
          check_in_at,
          check_out_at,
          status,
          late_minutes,
          latitude,
          longitude,
          location_label,
          users (
            name,
            division
          )
        `,
      )
      .order("attendance_date", { ascending: false })
      .order("check_in_at", { ascending: false }),
    supabase
      .from("users")
      .select("id, name, division")
      .eq("role", "employee")
      .eq("status", "active")
      .order("name", { ascending: true }),
  ]);

  if (attendanceResult.error) {
    throw new Error(`Gagal mengambil rekap absensi: ${attendanceResult.error.message}`);
  }

  if (usersResult.error) {
    throw new Error(`Gagal mengambil daftar pegawai: ${usersResult.error.message}`);
  }

  const rows = attendanceResult.data.map((row) => toRecapRow(row, settings));
  const todayUserIds = new Set(
    attendanceResult.data
      .filter((row) => row.attendance_date === today)
      .map((row) => row.user_id),
  );
  const missingTodayRows = usersResult.data
    .filter((user) => !todayUserIds.has(user.id))
    .map((user) => toGeneratedAlpaRow(user, today, settings));

  return [...missingTodayRows, ...rows];
}

export async function listEmployeeAttendance(userId) {
  if (!hasSupabaseEnv()) return [];

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("attendances")
    .select(attendanceColumns)
    .eq("user_id", userId)
    .order("attendance_date", { ascending: false })
    .order("check_in_at", { ascending: false });

  if (error) {
    throw new Error(`Gagal mengambil riwayat absensi: ${error.message}`);
  }

  return data.map(toEmployeeAttendance);
}

export async function getEmployeeAttendanceToday(userId) {
  if (!hasSupabaseEnv()) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("attendances")
    .select(attendanceColumns)
    .eq("user_id", userId)
    .eq("attendance_date", getJakartaDateKey())
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal mengambil absensi hari ini: ${error.message}`);
  }

  return toEmployeeAttendance(data);
}

export async function upsertEmployeeAttendance(userId, input) {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase env belum lengkap.");
  }

  const supabase = createSupabaseServerClient();
  const attendanceDate = input.dateKey || getJakartaDateKey();
  const status = normalizeAttendanceStatus(input.status);
  const payload = {
    user_id: userId,
    attendance_date: attendanceDate,
    status,
    late_minutes: input.lateMinutes || 0,
    location_label: input.location || null,
    latitude: input.latitude || null,
    longitude: input.longitude || null,
  };

  if (input.type === "keluar") {
    payload.check_out_at = input.capturedAt;
  } else {
    payload.check_in_at = input.capturedAt;
    payload.photo_url = input.photo || null;
  }

  const { data, error } = await supabase
    .from("attendances")
    .upsert(payload, { onConflict: "user_id,attendance_date" })
    .select(attendanceColumns)
    .single();

  if (error) {
    throw new Error(`Gagal menyimpan absensi: ${error.message}`);
  }

  return toEmployeeAttendance(data);
}

function toTimestamp(dateKey, time) {
  if (!dateKey || !time || time === "-") return null;

  return new Date(`${dateKey}T${time}:00+07:00`).toISOString();
}

export async function updateAttendanceByAdmin(id, input) {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase env belum lengkap.");
  }

  const supabase = createSupabaseServerClient();
  const settings = await getSystemSettings();
  const { data: current, error: currentError } = await supabase
    .from("attendances")
    .select("attendance_date")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    throw new Error(`Gagal mengambil absensi: ${currentError.message}`);
  }

  if (!current) {
    throw new Error("Data absensi tidak ditemukan.");
  }

  const dateKey = input.dateKey || current.attendance_date;
  const checkIn = input.checkIn || settings.workHours.startTime;
  const checkOut = input.checkOut || settings.workHours.endTime;
  const payload = {
    attendance_date: dateKey,
    check_in_at: toTimestamp(dateKey, checkIn),
    check_out_at: toTimestamp(dateKey, checkOut),
    status: input.status,
    late_minutes: input.lateMinutes || 0,
    location_label: input.location || null,
  };

  const { data, error } = await supabase
    .from("attendances")
    .update(payload)
    .eq("id", id)
    .select(attendanceColumns)
    .single();

  if (error) {
    throw new Error(`Gagal mengubah absensi: ${error.message}`);
  }

  return toRecapRow(data, settings);
}

export async function createAttendanceByAdmin(input) {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase env belum lengkap.");
  }

  const supabase = createSupabaseServerClient();
  const settings = await getSystemSettings();
  const checkIn = input.checkIn || settings.workHours.startTime;
  const checkOut = input.checkOut || settings.workHours.endTime;
  const payload = {
    user_id: input.userId,
    attendance_date: input.dateKey,
    check_in_at: toTimestamp(input.dateKey, checkIn),
    check_out_at: toTimestamp(input.dateKey, checkOut),
    status: input.status,
    late_minutes: input.lateMinutes || 0,
    location_label: input.location || null,
  };

  const { data, error } = await supabase
    .from("attendances")
    .upsert(payload, { onConflict: "user_id,attendance_date" })
    .select(attendanceColumns)
    .single();

  if (error) {
    throw new Error(`Gagal membuat absensi: ${error.message}`);
  }

  return toRecapRow(data, settings);
}

export async function getAdminAttendanceDashboard() {
  const fallbackCounts = demoAttendanceRows.reduce(
    (acc, row) => {
      if (row.status in acc) acc[row.status] += 1;
      return acc;
    },
    { hadir: 0, telat: 0, izin: 0, alpa: 0 },
  );

  if (!hasSupabaseEnv()) {
    return {
      totalEmployees: 0,
      counts: fallbackCounts,
      weeklyData: null,
      recentActivities: demoAttendanceRows.slice(0, 5),
    };
  }

  const today = getJakartaDateKey();
  const startDate = getLastDateKeys()[0];
  const supabase = createSupabaseServerClient();
  const [
    settings,
    { count, error: countError },
    { data, error },
    { data: weeklyRows, error: weeklyError },
  ] = await Promise.all([
    getSystemSettings(),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "employee")
      .eq("status", "active"),
    supabase
      .from("attendances")
      .select(attendanceColumns)
      .eq("attendance_date", today)
      .order("created_at", { ascending: false }),
    supabase
      .from("attendances")
      .select("attendance_date, status")
      .gte("attendance_date", startDate)
      .lte("attendance_date", today),
  ]);

  if (countError) {
    throw new Error(`Gagal menghitung pegawai: ${countError.message}`);
  }

  if (error) {
    throw new Error(`Gagal mengambil dashboard absensi: ${error.message}`);
  }

  if (weeklyError) {
    throw new Error(`Gagal mengambil grafik absensi: ${weeklyError.message}`);
  }

  const recordedTodayCounts = data.reduce(
    (acc, row) => {
      if (row.status in acc) acc[row.status] += 1;
      return acc;
    },
    { hadir: 0, telat: 0, izin: 0, alpa: 0 },
  );
  const totalEmployees = count || 0;
  const counts = {
    ...recordedTodayCounts,
    alpa: Math.max(
      totalEmployees -
        recordedTodayCounts.hadir -
        recordedTodayCounts.telat -
        recordedTodayCounts.izin,
      recordedTodayCounts.alpa,
    ),
  };

  return {
    totalEmployees,
    counts,
    weeklyData: buildWeeklyAttendanceData(weeklyRows || [], totalEmployees, settings),
    recentActivities: data.slice(0, 6).map((row) => ({
      id: row.id,
      name: row.users?.name || "Pegawai",
      division: row.users?.division || "-",
      date: formatDate(row.attendance_date),
      checkIn: formatTime(row.check_in_at),
      checkOut: formatTime(row.check_out_at),
      status: row.status,
      lateMinutes: row.late_minutes || 0,
      location: row.location_label || "-",
    })),
  };
}
