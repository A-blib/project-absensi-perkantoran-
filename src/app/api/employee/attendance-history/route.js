import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/guards";
import { createSupabaseServerClient } from "@/server/db/client";

const PAGE_SIZE = 10;
const DEFAULT_SHIFT = "Regular Shift";
const OFFICE_LOCATION = "Area Sudirman Pekanbaru";
const SCHEDULE_START = "08:00";
const TOLERANCE_MINUTES = 15;

function noStoreJson(payload, init = {}) {
  const response = NextResponse.json(payload, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

function clampPage(value) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function clampPageSize(value) {
  const size = Number(value);
  if (!Number.isFinite(size)) return PAGE_SIZE;
  return Math.min(100, Math.max(1, Math.floor(size)));
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthRange(year, month) {
  const selectedYear = Number(year) || new Date().getFullYear();
  const selectedMonth = Number(month) || new Date().getMonth() + 1;
  const startDate = new Date(selectedYear, selectedMonth - 1, 1);
  const endDate = new Date(selectedYear, selectedMonth, 0);

  return {
    start: toDateInput(startDate),
    end: toDateInput(endDate),
    year: selectedYear,
    month: selectedMonth,
  };
}

function getMonthDates(year, month) {
  const totalDays = new Date(year, month, 0).getDate();
  return Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });
}

function formatLongDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatShortDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatMonthYear(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatTime(value) {
  if (!value) return "--:--:--";

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function getMinutesFromTime(value) {
  const match = value?.match(/(\d{2})[.:](\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function getJakartaNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(new Date())
    .reduce((values, part) => {
      values[part.type] = part.value;
      return values;
    }, {});

  return {
    dateValue: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function shouldCreateVirtualAbsence(dateValue, now = getJakartaNow()) {
  if (dateValue > now.dateValue) return false;
  if (dateValue === now.dateValue) return false;
  return dateValue < now.dateValue;
}

function normalizeStatus(row) {
  if (row?.status === "izin") return "Izin";
  if (row?.status === "alpa") return "Tidak Hadir";
  if (!row?.check_in_at) return "Tidak Hadir";
  if (row.check_in_at && !row.check_out_at) return "Belum Pulang";
  if (row.status === "telat" || (row.late_minutes || 0) > 0) return "Terlambat";

  const clockIn = formatTime(row.check_in_at);
  const actual = getMinutesFromTime(clockIn);
  const target = getMinutesFromTime(SCHEDULE_START) + TOLERANCE_MINUTES;
  return actual !== null && actual > target ? "Terlambat" : "Hadir";
}

function buildSearchText(row) {
  const longDate = formatLongDate(row.dateValue).toLowerCase();
  return [
    row.dateValue,
    formatShortDate(row.dateValue),
    longDate,
    longDate.replace(",", ""),
    formatMonthYear(row.dateValue).toLowerCase(),
    row.location,
    row.status,
    row.shift,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function attendanceToHistoryRow(dateValue, attendance) {
  const row = {
    id: attendance?.id || `virtual-${dateValue}`,
    dateValue,
    location: attendance?.location_label || OFFICE_LOCATION,
    clockIn: formatTime(attendance?.check_in_at),
    clockOut: formatTime(attendance?.check_out_at),
    status: normalizeStatus(attendance),
    shift: DEFAULT_SHIFT,
    photo: attendance?.photo_url || null,
    outPhoto: attendance?.photo_out_url || null,
    hasCheckedOut: Boolean(attendance?.check_out_at),
    source: attendance ? "supabase" : "generated",
  };

  return {
    ...row,
    searchText: buildSearchText(row),
  };
}

function buildFinalRows(dates, attendanceByDate, now) {
  return dates
    .flatMap((dateValue) => {
      const attendance = attendanceByDate.get(dateValue);
      if (attendance) return [attendanceToHistoryRow(dateValue, attendance)];
      if (shouldCreateVirtualAbsence(dateValue, now)) {
        return [attendanceToHistoryRow(dateValue, null)];
      }
      return [];
    })
    .sort((a, b) => b.dateValue.localeCompare(a.dateValue));
}

function applyFinalFilters(rows, filters) {
  const query = filters.search.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesStatus =
      filters.status === "Semua" ||
      row.status === filters.status ||
      (filters.status === "Sakit" && row.status === "Sakit");
    const matchesShift = filters.shift === "Semua" || row.shift === filters.shift;
    const matchesSearch = !query || row.searchText.includes(query);

    return matchesStatus && matchesShift && matchesSearch;
  });
}

function buildSummary(rows) {
  return rows.reduce(
    (summary, row) => {
      if (row.status === "Hadir") summary.hadir += 1;
      if (row.status === "Terlambat") summary.terlambat += 1;
      if (row.status === "Izin" || row.status === "Sakit") summary.izin += 1;
      if (row.status === "Tidak Hadir") summary.tidakHadir += 1;
      return summary;
    },
    { hadir: 0, terlambat: 0, izin: 0, tidakHadir: 0 },
  );
}

async function getAvailableYears(supabase, sessionId) {
  const [oldest, newest] = await Promise.all([
    supabase
      .from("attendances")
      .select("attendance_date")
      .eq("user_id", sessionId)
      .order("attendance_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("attendances")
      .select("attendance_date")
      .eq("user_id", sessionId)
      .order("attendance_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (oldest.error || newest.error || !oldest.data || !newest.data) {
    return [new Date().getFullYear()];
  }

  const startYear = new Date(oldest.data.attendance_date).getFullYear();
  const endYear = new Date(newest.data.attendance_date).getFullYear();
  return Array.from({ length: endYear - startYear + 1 }, (_, index) => endYear - index);
}

async function getAttendanceRows(supabase, sessionId, selected) {
  const baseColumns = `
    id,
    user_id,
    attendance_date,
    check_in_at,
    check_out_at,
    status,
    late_minutes,
    photo_url,
    location_label
  `;
  const extendedColumns = `
    ${baseColumns},
    photo_out_url
  `;

  const extendedResult = await supabase
    .from("attendances")
    .select(extendedColumns)
    .eq("user_id", sessionId)
    .gte("attendance_date", selected.start)
    .lte("attendance_date", selected.end);

  if (!extendedResult.error) return extendedResult;

  const missingPhotoOutColumn =
    extendedResult.error.message?.includes("photo_out_url") ||
    extendedResult.error.message?.includes("does not exist");

  if (!missingPhotoOutColumn) return extendedResult;

  console.log("[attendance-history:fallback-query]", {
    reason: "photo_out_url column missing",
    message: extendedResult.error.message,
  });

  return supabase
    .from("attendances")
    .select(baseColumns)
    .eq("user_id", sessionId)
    .gte("attendance_date", selected.start)
    .lte("attendance_date", selected.end);
}

export async function GET(request) {
  const session = await getCurrentSession();

  if (!session || session.role !== "employee") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = clampPage(searchParams.get("page"));
  const pageSize = clampPageSize(searchParams.get("pageSize"));
  const exportMode = searchParams.get("export") === "1";
  const filters = {
    month: searchParams.get("month") || String(new Date().getMonth() + 1),
    year: searchParams.get("year") || String(new Date().getFullYear()),
    status: searchParams.get("status") || "Semua",
    shift: searchParams.get("shift") || "Semua",
    search: searchParams.get("search") || "",
  };
  const selected = monthRange(filters.year, filters.month);
  const now = getJakartaNow();

  console.log("[attendance-history:request]", {
    userId: session.id,
    filters,
    selected,
    today: now.dateValue,
    currentMinutes: now.minutes,
  });

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    session.id?.startsWith("demo-")
  ) {
    const finalRows = buildFinalRows(
      getMonthDates(selected.year, selected.month),
      new Map(),
      now,
    );
    const filteredRows = applyFinalFilters(finalRows, filters);
    const from = (page - 1) * pageSize;

    return noStoreJson({
      rows: exportMode ? filteredRows : filteredRows.slice(from, from + pageSize),
      total: filteredRows.length,
      page,
      pageSize,
      years: [selected.year],
      employee: { name: session.name || "Karyawan" },
      summary: buildSummary(finalRows),
    });
  }

  const supabase = createSupabaseServerClient();

  try {
    const [attendanceResult, years] = await Promise.all([
      getAttendanceRows(supabase, session.id, selected),
      getAvailableYears(supabase, session.id),
    ]);

    if (attendanceResult.error) throw attendanceResult.error;

    console.log("[attendance-history:supabase-result]", {
      userId: session.id,
      count: attendanceResult.data?.length || 0,
      rows: attendanceResult.data || [],
    });

    const attendanceByDate = new Map(
      (attendanceResult.data || []).map((row) => [row.attendance_date, row]),
    );
    const finalRows = buildFinalRows(
      getMonthDates(selected.year, selected.month),
      attendanceByDate,
      now,
    );
    const filteredRows = applyFinalFilters(finalRows, filters);
    const from = (page - 1) * pageSize;
    const pageRows = exportMode ? filteredRows : filteredRows.slice(from, from + pageSize);

    console.log("[attendance-history:final]", {
      userId: session.id,
      finalCount: finalRows.length,
      filteredCount: filteredRows.length,
      firstRows: finalRows.slice(0, 3),
    });

    return noStoreJson({
      rows: pageRows,
      total: filteredRows.length,
      page,
      pageSize,
      years: years.includes(selected.year) ? years : [selected.year, ...years],
      employee: { name: session.name || "Karyawan" },
      summary: buildSummary(finalRows),
    });
  } catch (error) {
    return noStoreJson(
      { message: `Gagal mengambil riwayat absensi: ${error.message}` },
      { status: 500 },
    );
  }
}
