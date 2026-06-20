"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Download, Moon, SunMedium } from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { useCurrentUser } from "@/lib/browser/use-current-user";

const monthNames = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];
const dayNames = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

const DEFAULT_CONFIG = {
  workHours: { startTime: "08:00", endTime: "17:00", lateTolerance: 15, workDays: ["Senin","Selasa","Rabu","Kamis","Jumat"], shiftName: null },
};

function getJakartaDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function formatDisplayDate(date) {
  return date?.toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric", timeZone:"Asia/Jakarta" });
}

function getCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getWeekStart(date) {
  const ws = new Date(date);
  const day = ws.getDay();
  ws.setDate(ws.getDate() - (day === 0 ? 6 : day - 1));
  ws.setHours(0, 0, 0, 0);
  return ws;
}

function isWorkDay(date, workDays) {
  const name = dayNames[date.getDay()];
  return workDays.includes(name);
}

function getScheduleForDate(date, config) {
  const wh = config.workHours;
  const workday = isWorkDay(date, wh.workDays || []);
  return {
    date: formatDateKey(date),
    dayName: dayNames[date.getDay()],
    start: workday ? wh.startTime : "-",
    end: workday ? wh.endTime : "-",
    shift: workday ? (wh.shiftName || "Reguler") : "Libur",
    status: workday ? "Kerja" : "Libur",
    tolerance: wh.lateTolerance || 15,
  };
}

function buildMonthSchedules(today, config) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const total = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: total }, (_, i) =>
    getScheduleForDate(new Date(year, month, i + 1), config)
  );
}

function buildWeekSchedules(today, config) {
  const ws = getWeekStart(today);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(ws);
    d.setDate(ws.getDate() + i);
    return getScheduleForDate(d, config);
  });
}

function downloadScheduleCsv(schedules, monthLabel) {
  const rows = [
    ["Tanggal","Hari","Jam Masuk","Jam Keluar","Shift","Status"],
    ...schedules.map((s) => [s.date, s.dayName, s.start, s.end, s.shift, s.status]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jadwal-kerja-${monthLabel.toLowerCase().replaceAll(" ", "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EmployeeSchedulePage() {
  const { user } = useCurrentUser();
  const [today, setToday] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    const update = () => setToday(getJakartaDate());
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/employee/attendance-config", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((payload) => { if (active && payload?.config) setConfig(payload.config); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const state = useMemo(() => {
    if (!today) return null;
    const monthSchedules = buildMonthSchedules(today, config);
    const weekSchedules = buildWeekSchedules(today, config);
    const todayKey = formatDateKey(today);
    const activeShift = getScheduleForDate(today, config);
    const wh = config.workHours;
    const shiftLabel = wh.shiftName
      ? `Shift ${wh.shiftName} · ${wh.startTime} - ${wh.endTime}`
      : `${wh.startTime} - ${wh.endTime}`;

    return {
      year: today.getFullYear(),
      month: today.getMonth(),
      todayKey,
      monthSchedules,
      weekSchedules,
      activeShift,
      shiftLabel,
      monthLabel: `${monthNames[today.getMonth()]} ${today.getFullYear()}`,
      calendarDays: getCalendarCells(today.getFullYear(), today.getMonth()),
    };
  }, [today, config]);

  if (!state) {
    return (
      <EmployeeShell>
        <div className="glass-panel rounded-3xl p-6 text-[#d4e4fa]">Memuat jadwal...</div>
      </EmployeeShell>
    );
  }

  return (
    <EmployeeShell initialUser={user}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[#8B9DB5]">Work schedule calendar</p>
          <h2 className="mt-1 text-2xl font-bold text-[#d4e4fa]">Jadwal Kerja</h2>
          <p className="mt-1 text-sm text-[#8B9DB5]">{state.shiftLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => downloadScheduleCsv(state.monthSchedules, state.monthLabel)}
          className="flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-[#24344D] bg-[#132238] px-5 font-semibold text-[#d4e4fa] transition hover:-translate-y-1 hover:border-[#3b82f6]"
        >
          <Download size={18} />
          Export Jadwal
        </button>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {/* Kalender bulan */}
          <div className="glass-panel rounded-3xl p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#d4e4fa]">{state.monthLabel}</h3>
                <p className="mt-1 text-sm text-[#8B9DB5]">
                  {config.workHours.shiftName
                    ? `Shift ${config.workHours.shiftName}`
                    : "Jadwal kerja reguler"}
                </p>
              </div>
              <CalendarDays size={24} className="text-[#60a5fa]" />
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B9DB5]">
              {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d) => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {state.calendarDays.map((day, index) => {
                const schedule = day ? state.monthSchedules[day - 1] : null;
                const isToday = schedule?.date === state.todayKey;
                return (
                  <div
                    key={`${day ?? "e"}-${index}`}
                    className={[
                      "min-h-[64px] rounded-xl border p-2",
                      day ? "border-[#24344D] bg-[#0B1220]" : "border-transparent bg-transparent",
                      isToday ? "ring-2 ring-[#3b82f6]/60" : "",
                      schedule?.status === "Libur" && day ? "opacity-40" : "",
                    ].join(" ")}
                  >
                    {schedule ? (
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-semibold text-[#d4e4fa]">{day}</span>
                        {isToday ? (
                          <span className="rounded-full bg-[#3b82f6] px-1.5 py-0.5 text-[9px] font-bold text-white">
                            Hari ini
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Jadwal 6 hari ke depan */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {state.weekSchedules.map((schedule) => {
              const isToday = schedule.date === state.todayKey;
              const isWork = schedule.status === "Kerja";
              return (
                <div
                  key={schedule.date}
                  className={[
                    "glass-panel rounded-3xl p-5 transition hover:-translate-y-1",
                    isToday ? "border-[#3b82f6]/60" : "",
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
                          {isWork ? `${schedule.start} - ${schedule.end}` : "Libur"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isWork ? <SunMedium size={18} className="text-amber-300" /> : <Moon size={18} className="text-[#60a5fa]" />}
                      <div>
                        <p className="text-xs text-[#8B9DB5]">Shift</p>
                        <p className="font-semibold text-[#c2c6d6]">{schedule.shift}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar shift aktif */}
        <aside className="space-y-6">
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-bold text-[#d4e4fa]">Shift Aktif</h3>
            <div className="mt-5 rounded-3xl border border-[#24344D] bg-[#0B1220] p-5">
              <p className="text-sm text-[#8B9DB5]">{formatDisplayDate(today)}</p>
              <p className="mt-2 text-3xl font-bold text-[#d4e4fa]">
                {state.activeShift.status === "Kerja"
                  ? `${state.activeShift.start} - ${state.activeShift.end}`
                  : "Libur"}
              </p>
              <p className="mt-3 text-sm text-[#8B9DB5]">
                {state.activeShift.status === "Kerja"
                  ? `Shift ${state.activeShift.shift}. Toleransi keterlambatan ${state.activeShift.tolerance} menit.`
                  : "Tidak ada shift aktif hari ini."}
              </p>
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              {[
                ["Jam Masuk", config.workHours.startTime],
                ["Jam Pulang", config.workHours.endTime],
                ["Toleransi", `${config.workHours.lateTolerance} menit`],
                ["Hari Kerja", (config.workHours.workDays || []).join(", ") || "-"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-[#24344D] bg-[#0B1220] px-4 py-2.5">
                  <span className="text-[#8B9DB5]">{label}</span>
                  <span className="font-bold text-[#d4e4fa]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </EmployeeShell>
  );
}
