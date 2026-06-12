"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Download,
  Moon,
  SunMedium,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";

const monthNames = [
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

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const specialAgenda = {
  3: "Meeting",
  12: "Payroll",
  17: "Briefing",
  24: "Audit",
};

function getJakartaDate() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function getCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => null);

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getWeekStart(date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function getScheduleForDate(date) {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const agenda = specialAgenda[date.getDate()];

  if (isWeekend) {
    return {
      date: formatDateKey(date),
      dayName: dayNames[day],
      start: "-",
      end: "-",
      shift: "Libur",
      status: "Libur",
      agenda: agenda || "Libur",
      tolerance: 0,
    };
  }

  return {
    date: formatDateKey(date),
    dayName: dayNames[day],
    start: "08:00",
    end: day === 5 ? "16:30" : "17:00",
    shift: "Pagi",
    status: "Kerja",
    agenda: agenda || "Regular",
    tolerance: 10,
  };
}

function buildMonthSchedules(today) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(year, month, index + 1);
    return getScheduleForDate(date);
  });
}

function buildWeekSchedules(today) {
  const weekStart = getWeekStart(today);
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return getScheduleForDate(date);
  });
}

function downloadScheduleCsv(schedules, monthLabel) {
  const rows = [
    ["Tanggal", "Hari", "Jam Masuk", "Jam Keluar", "Shift", "Status", "Agenda"],
    ...schedules.map((schedule) => [
      schedule.date,
      schedule.dayName,
      schedule.start,
      schedule.end,
      schedule.shift,
      schedule.status,
      schedule.agenda,
    ]),
  ];
  const csv = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jadwal-kerja-${monthLabel.toLowerCase().replaceAll(" ", "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function EmployeeSchedulePage() {
  const [today, setToday] = useState(null);

  useEffect(() => {
    const update = () => setToday(getJakartaDate());
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  const scheduleState = useMemo(() => {
    if (!today) return null;

    const monthSchedules = buildMonthSchedules(today);
    const weekSchedules = buildWeekSchedules(today);
    const todayKey = formatDateKey(today);
    const activeShift =
      weekSchedules.find((schedule) => schedule.date === todayKey) ||
      getScheduleForDate(today);
    const upcoming = monthSchedules
      .filter(
        (schedule) =>
          schedule.date >= todayKey &&
          schedule.agenda !== "Regular" &&
          schedule.agenda !== "Libur",
      )
      .slice(0, 3);

    return {
      year: today.getFullYear(),
      month: today.getMonth(),
      date: today.getDate(),
      todayKey,
      monthSchedules,
      weekSchedules,
      activeShift,
      upcoming,
      monthLabel: `${monthNames[today.getMonth()]} ${today.getFullYear()}`,
      calendarDays: getCalendarCells(today.getFullYear(), today.getMonth()),
    };
  }, [today]);

  if (!scheduleState) {
    return (
      <EmployeeShell>
        <div className="glass-panel rounded-3xl p-6 text-[#d4e4fa]">
          Memuat jadwal kerja...
        </div>
      </EmployeeShell>
    );
  }

  return (
    <EmployeeShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[#8B9DB5]">Work schedule calendar</p>
          <h2 className="mt-1 text-2xl font-bold text-[#d4e4fa]">
            Jadwal Kerja
          </h2>
        </div>
        <button
          type="button"
          onClick={() =>
            downloadScheduleCsv(scheduleState.monthSchedules, scheduleState.monthLabel)
          }
          className="flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-[#24344D] bg-[#132238] px-5 font-semibold text-[#d4e4fa] transition hover:-translate-y-1 hover:border-[#3b82f6]"
        >
          <Download size={18} />
          Export Jadwal
        </button>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#d4e4fa]">
                  {scheduleState.monthLabel}
                </h3>
                <p className="mt-1 text-sm text-[#8B9DB5]">
                  Kalender operasional divisi keuangan
                </p>
              </div>
              <CalendarDays size={24} className="text-[#60a5fa]" />
            </div>

            <div className="overflow-hidden">
              <div className="w-full">
                <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B9DB5]">
                  {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                    (day) => (
                      <div key={day} className="py-2">
                        {day}
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {scheduleState.calendarDays.map((day, index) => {
                    const schedule = day
                      ? scheduleState.monthSchedules[day - 1]
                      : null;
                    const isToday = schedule?.date === scheduleState.todayKey;

                    return (
                      <div
                        key={`${day || "empty"}-${index}`}
                        className={[
                          "min-h-[76px] rounded-xl border p-2",
                          day
                            ? "border-[#24344D] bg-[#0B1220]"
                            : "border-transparent bg-transparent",
                          isToday ? "ring-2 ring-[#3b82f6]/60" : "",
                        ].join(" ")}
                      >
                        {schedule ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-[#d4e4fa]">
                                {day}
                              </span>
                              {isToday ? (
                                <span className="size-2 rounded-full bg-[#3b82f6]" />
                              ) : null}
                            </div>
                            <div
                              className={[
                                "mt-3 truncate rounded-lg px-2 py-1.5 text-[11px] font-semibold",
                                schedule.agenda === "Regular"
                                  ? "bg-[#132238] text-[#8B9DB5]"
                                  : schedule.agenda === "Libur"
                                    ? "bg-slate-400/10 text-slate-300"
                                    : "bg-[#3b82f6]/12 text-[#93c5fd]",
                              ].join(" ")}
                            >
                              {schedule.agenda}
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {scheduleState.weekSchedules.map((schedule) => {
              const isToday = schedule.date === scheduleState.todayKey;
              const isWorkday = schedule.status === "Kerja";

              return (
                <div
                  key={schedule.date}
                  className={[
                    "glass-panel rounded-3xl p-5 transition hover:-translate-y-1",
                    isToday ? "border-[#3b82f6]/60 shadow-blue-500/10" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#0B1220] px-3 py-1 text-sm font-semibold text-[#d4e4fa]">
                      {schedule.dayName}
                    </span>
                    {isToday ? (
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Hari ini
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock3 size={18} className="text-[#60a5fa]" />
                      <div>
                        <p className="text-xs text-[#8B9DB5]">Jam kerja</p>
                        <p className="font-mono text-lg font-bold text-[#d4e4fa]">
                          {isWorkday ? `${schedule.start} - ${schedule.end}` : "Libur"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isWorkday ? (
                        <SunMedium size={18} className="text-amber-300" />
                      ) : (
                        <Moon size={18} className="text-[#60a5fa]" />
                      )}
                      <div>
                        <p className="text-xs text-[#8B9DB5]">Shift</p>
                        <p className="font-semibold text-[#c2c6d6]">
                          {schedule.shift}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-bold text-[#d4e4fa]">Shift Aktif</h3>
            <div className="mt-5 rounded-3xl border border-[#24344D] bg-[#0B1220] p-5">
              <p className="text-sm text-[#8B9DB5]">
                {formatDisplayDate(today)}
              </p>
              <p className="mt-2 text-3xl font-bold text-[#d4e4fa]">
                {scheduleState.activeShift.status === "Kerja"
                  ? `${scheduleState.activeShift.start} - ${scheduleState.activeShift.end}`
                  : "Libur"}
              </p>
              <p className="mt-3 text-sm text-[#8B9DB5]">
                {scheduleState.activeShift.status === "Kerja"
                  ? `Shift ${scheduleState.activeShift.shift}. Toleransi keterlambatan ${scheduleState.activeShift.tolerance} menit.`
                  : "Tidak ada shift aktif hari ini."}
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-bold text-[#d4e4fa]">
              Upcoming Schedule
            </h3>
            <div className="mt-5 space-y-3">
              {scheduleState.upcoming.length ? (
                scheduleState.upcoming.map((schedule) => (
                  <div
                    key={`${schedule.date}-${schedule.agenda}`}
                    className="rounded-2xl border border-[#24344D] bg-[#0B1220] p-4"
                  >
                    <p className="font-semibold text-[#d4e4fa]">
                      {schedule.agenda}
                    </p>
                    <p className="mt-1 text-sm text-[#8B9DB5]">
                      {formatDisplayDate(new Date(`${schedule.date}T00:00:00`))}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-[#24344D] bg-[#0B1220] p-4 text-sm text-[#8B9DB5]">
                  Tidak ada agenda mendatang bulan ini.
                </p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </EmployeeShell>
  );
}
