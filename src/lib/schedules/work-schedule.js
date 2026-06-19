export const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const shortDayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export const statusConfig = {
  "Hari Kerja": { color: "#60A5FA", className: "border-[#60A5FA]/35 bg-[#60A5FA]/12 text-[#BFDBFE]" },
  Meeting: { color: "#A78BFA", className: "border-[#A78BFA]/35 bg-[#A78BFA]/12 text-[#DDD6FE]" },
  Training: { color: "#22C55E", className: "border-[#22C55E]/35 bg-[#22C55E]/12 text-[#BBF7D0]" },
  Audit: { color: "#F59E0B", className: "border-[#F59E0B]/35 bg-[#F59E0B]/12 text-[#FDE68A]" },
  "Work From Home": { color: "#22D3EE", className: "border-[#22D3EE]/35 bg-[#22D3EE]/12 text-[#CFFAFE]" },
  "Libur Nasional": { color: "#94A3B8", className: "border-[#94A3B8]/30 bg-[#94A3B8]/10 text-[#CBD5E1]" },
  "Cuti Bersama": { color: "#94A3B8", className: "border-[#94A3B8]/30 bg-[#94A3B8]/10 text-[#CBD5E1]" },
  Overtime: { color: "#FB7185", className: "border-[#FB7185]/35 bg-[#FB7185]/12 text-[#FFE4E6]" },
};

const agendaByDate = {
  3: { agenda: "Meeting Direksi", status: "Meeting", note: "Review performa bulanan bersama manajemen." },
  8: { agenda: "Work From Home", status: "Work From Home", note: "Koordinasi pekerjaan dilakukan secara remote." },
  12: { agenda: "Payroll", status: "Hari Kerja", note: "Finalisasi data payroll dan validasi absensi." },
  17: { agenda: "Training HRIS", status: "Training", note: "Sesi peningkatan kemampuan penggunaan sistem HRIS." },
  24: { agenda: "Audit Internal", status: "Audit", note: "Audit dokumen keuangan dan administrasi absensi." },
  26: { agenda: "Meeting Direksi", status: "Meeting", note: "Rapat koordinasi agenda operasional berikutnya." },
  28: { agenda: "Training Compliance", status: "Training", note: "Pelatihan kepatuhan internal perusahaan." },
  30: { agenda: "Overtime Closing", status: "Overtime", note: "Perpanjangan jam kerja untuk closing bulanan." },
};

const defaultShift = {
  id: "regular",
  name: "Regular Shift",
  start: "08:00",
  end: "17:00",
  location: "Kantor Pusat",
  tolerance: 10,
};

export function getJakartaDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}

export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey) {
  return new Date(`${dateKey}T00:00:00+07:00`);
}

export function formatDisplayDate(value, variant = "long") {
  const date = typeof value === "string" ? parseDateKey(value) : value;
  return date.toLocaleDateString("id-ID", {
    weekday: variant === "withDay" ? "long" : undefined,
    day: "2-digit",
    month: variant === "short" ? "short" : "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export function getCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => null);

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function getWeekStart(date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

export function toMinutes(time) {
  if (!time || time === "-") return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function buildScheduleRecord(date) {
  const day = date.getDay();
  const dateKey = formatDateKey(date);
  const isWeekend = day === 0 || day === 6;
  const special = agendaByDate[date.getDate()];
  const isFriday = day === 5;
  const isWfh = special?.status === "Work From Home";
  const status = isWeekend ? "Libur Nasional" : special?.status || "Hari Kerja";
  const hasWorkShift = !isWeekend;
  const shift = hasWorkShift
    ? {
        ...defaultShift,
        end: special?.status === "Overtime" ? "19:00" : isFriday ? "16:30" : defaultShift.end,
        location: isWfh ? "Remote" : defaultShift.location,
      }
    : null;

  return {
    id: `schedule-${dateKey}`,
    employeeId: "current-employee",
    date: dateKey,
    dayName: dayNames[day],
    shiftId: shift?.id || null,
    shiftName: shift?.name || "Tidak Ada Jadwal",
    start: shift?.start || "-",
    end: shift?.end || "-",
    status,
    agenda: special?.agenda || (isWeekend ? "Libur" : "Operasional Reguler"),
    location: shift?.location || "-",
    tolerance: shift?.tolerance || 0,
    note: special?.note || (isWeekend ? "Tidak ada jadwal kerja." : "Jadwal operasional normal."),
  };
}

export function getSchedules(year, month) {
  const totalDays = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: totalDays }, (_, index) =>
    buildScheduleRecord(new Date(year, month, index + 1)),
  );
}

export function validateSchedules(schedules) {
  const seenDates = new Set();
  const warnings = [];

  schedules.forEach((schedule) => {
    const start = toMinutes(schedule.start);
    const end = toMinutes(schedule.end);

    if (start !== null && end !== null && start > end) {
      warnings.push(`Jam masuk lebih besar dari jam pulang pada ${formatDisplayDate(schedule.date)}.`);
    }
    if (seenDates.has(schedule.date)) {
      warnings.push(`Jadwal duplikat terdeteksi pada ${formatDisplayDate(schedule.date)}.`);
    }
    if (schedule.status !== "Libur Nasional" && !schedule.shiftId) {
      warnings.push(`Shift tidak ditemukan pada ${formatDisplayDate(schedule.date)}. Shift default digunakan.`);
    }

    seenDates.add(schedule.date);
  });

  return warnings;
}

export function getStatusMeta(status) {
  return statusConfig[status] || statusConfig["Hari Kerja"];
}

export function isActivity(schedule) {
  return !["Operasional Reguler", "Libur"].includes(schedule.agenda);
}
