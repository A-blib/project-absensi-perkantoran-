"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileQuestion,
  Info,
  MapPin,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import {
  buildScheduleRecord,
  formatDateKey,
  formatDisplayDate,
  getCalendarCells,
  getJakartaDate,
  getSchedules,
  getStatusMeta,
  getWeekStart,
  monthNames,
  parseDateKey,
  shortDayNames,
  validateSchedules,
} from "@/lib/schedules/work-schedule";

function downloadScheduleCsv(schedules, monthLabel) {
  const rows = [
    ["Tanggal", "Hari", "Jam Masuk", "Jam Keluar", "Shift", "Status", "Lokasi", "Agenda", "Keterangan"],
    ...schedules.map((schedule) => [
      schedule.date,
      schedule.dayName,
      schedule.start,
      schedule.end,
      schedule.shiftName,
      schedule.status,
      schedule.location,
      schedule.agenda,
      schedule.note,
    ]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jadwal-kerja-${monthLabel.toLowerCase().replaceAll(" ", "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
      {status}
    </span>
  );
}

function DetailRow({ label, value, Icon }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#2D4568]/70 bg-[#0D1728] px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
        {Icon ? <Icon size={14} className="text-[#38BDF8]" /> : null}
        {label}
      </div>
      <p className="text-right text-sm font-semibold text-[#F8FAFC]">{value}</p>
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <EmployeeShell>
      <div className="mx-auto max-w-[1440px] space-y-5">
        <div className="h-16 animate-pulse rounded-2xl bg-[#142136]" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[520px] animate-pulse rounded-3xl bg-[#142136]" />
          <div className="h-[520px] animate-pulse rounded-3xl bg-[#142136]" />
        </div>
      </div>
    </EmployeeShell>
  );
}

export default function EmployeeSchedulePage() {
  const [today, setToday] = useState(() => getJakartaDate());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const jakartaToday = getJakartaDate();
    return new Date(jakartaToday.getFullYear(), jakartaToday.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(getJakartaDate()));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setToday(getJakartaDate()), 60000);
    const loadingTimer = setTimeout(() => setIsLoading(false), 360);
    return () => {
      clearInterval(timer);
      clearTimeout(loadingTimer);
    };
  }, []);

  const scheduleState = useMemo(() => {
    if (!today || !visibleMonth) return null;

    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const todayKey = formatDateKey(today);
    const schedules = getSchedules(year, month);
    const schedulesByDate = new Map(schedules.map((schedule) => [schedule.date, schedule]));
    const selectedSchedule = schedulesByDate.get(selectedDate) || null;
    const todaySchedule = schedulesByDate.get(todayKey) || null;
    const selectedDateObject = selectedDate ? parseDateKey(selectedDate) : today;
    const weekStart = getWeekStart(selectedDateObject);
    const weekSchedules = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return schedulesByDate.get(formatDateKey(date)) || buildScheduleRecord(date);
    });
    return {
      year,
      month,
      todayKey,
      schedules,
      schedulesByDate,
      selectedSchedule,
      todaySchedule,
      weekSchedules,
      warnings: validateSchedules(schedules),
      monthLabel: `${monthNames[month]} ${year}`,
      calendarDays: getCalendarCells(year, month),
    };
  }, [today, visibleMonth, selectedDate]);

  function changeMonth(direction) {
    setVisibleMonth((current) => {
      const base = current || getJakartaDate();
      const next = new Date(base.getFullYear(), base.getMonth() + direction, 1);
      setSelectedDate(formatDateKey(next));
      return next;
    });
  }

  function goToday() {
    const jakartaToday = getJakartaDate();
    setToday(jakartaToday);
    setVisibleMonth(new Date(jakartaToday.getFullYear(), jakartaToday.getMonth(), 1));
    setSelectedDate(formatDateKey(jakartaToday));
  }

  if (isLoading || !scheduleState) return <ScheduleSkeleton />;

  const selectedSchedule = scheduleState.selectedSchedule;
  const todaySchedule = scheduleState.todaySchedule;

  return (
    <EmployeeShell>
      <div className="mx-auto max-w-[1440px] space-y-5 pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-[#3B82F6]/30 bg-[linear-gradient(145deg,#1B2A44_0%,#122139_58%,#0B1424_100%)] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.36),0_0_0_1px_rgba(56,189,248,0.07)] sm:p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#38BDF8,#22C55E,#F59E0B,#A78BFA)]" />
          <div className="absolute right-6 top-4 h-24 w-24 rounded-full bg-[#38BDF8]/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#BAE6FD]">
                <CalendarDays size={14} />
                Work schedule calendar
              </div>
              <h2 className="text-2xl font-bold text-[#F8FAFC] sm:text-3xl">
                Jadwal Kerja
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#A7B3C6]">
                Kalender, shift, agenda, dan jadwal mingguan tersinkron dari satu data bulan aktif.
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
              <div className="grid flex-1 grid-cols-3 rounded-2xl border border-[#3B82F6]/35 bg-[#0D1728]/90 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:flex-none">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold text-[#F8FAFC] transition hover:bg-[#223754]"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Sebelumnya</span>
                <span className="sm:hidden">Prev</span>
              </button>
              <button
                type="button"
                onClick={goToday}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#38BDF8]/30 bg-[#142136] px-3 text-sm font-bold text-[#DDF7FF] transition hover:border-[#38BDF8]"
              >
                <RefreshCw size={15} />
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold text-[#F8FAFC] transition hover:bg-[#223754]"
              >
                <span className="hidden sm:inline">Berikutnya</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => downloadScheduleCsv(scheduleState.schedules, scheduleState.monthLabel)}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#60A5FA]/55 bg-[#1D4ED8] px-4 text-sm font-bold text-white shadow-[0_12px_26px_rgba(37,99,235,0.22)] transition hover:bg-[#2563EB]"
            >
              <Download size={17} />
              Export
            </button>
            <Link
              href="/employee/upcoming-activities"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#38BDF8]/40 bg-[#0D1728] px-4 text-sm font-bold text-[#DDF7FF] transition hover:border-[#38BDF8] hover:bg-[#142136]"
            >
              Upcoming
              <ChevronRight size={16} />
            </Link>
            </div>
          </div>
        </div>

        {scheduleState.warnings.length ? (
          <div className="rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-sm text-[#FDE68A]">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle size={17} />
              Validasi Jadwal
            </div>
            <div className="mt-2 space-y-1">
              {scheduleState.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-3xl border border-[#60A5FA]/35 bg-[linear-gradient(145deg,#1A2A42_0%,#132238_52%,#0A1324_100%)] p-4 shadow-[0_26px_64px_rgba(0,0,0,0.40),0_0_0_1px_rgba(96,165,250,0.08),0_0_34px_rgba(56,189,248,0.08)] sm:p-5">
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#38BDF8,#22C55E,#F59E0B,#A78BFA)]" />
              <div className="absolute -right-10 top-14 h-32 w-32 rounded-full bg-[#60A5FA]/10 blur-3xl" />
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#F8FAFC]">{scheduleState.monthLabel}</h3>
                  <p className="mt-1 text-sm text-[#A7B3C6]">
                    Klik tanggal untuk melihat detail jadwal harian.
                  </p>
                </div>
                <CalendarDays size={24} className="text-[#60A5FA]" />
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B9DB5] sm:gap-2">
                {shortDayNames.map((day) => (
                  <div key={day} className="py-1.5">
                    {day}
                  </div>
                ))}
              </div>
              <div className="mt-1.5 grid grid-cols-7 gap-1.5 sm:gap-2">
                {scheduleState.calendarDays.map((day, index) => {
                  const schedule = day ? scheduleState.schedules[day - 1] : null;
                  const isToday = schedule?.date === scheduleState.todayKey;
                  const isSelected = schedule?.date === selectedDate;
                  const meta = schedule ? getStatusMeta(schedule.status) : null;

                  return (
                    <button
                      key={`${day || "empty"}-${index}`}
                      type="button"
                      disabled={!schedule}
                      title={schedule ? `${schedule.agenda} - ${schedule.start} sampai ${schedule.end}` : ""}
                      onClick={() => schedule && setSelectedDate(schedule.date)}
                      className={[
                        "min-h-[64px] rounded-xl border p-2 text-left transition sm:min-h-[70px]",
                        schedule
                          ? "bg-[linear-gradient(145deg,#10203A,#0D1728)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_18px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:border-[#38BDF8]/60 hover:bg-[#142136]"
                          : "cursor-default border-transparent bg-transparent",
                        isSelected ? "border-[#38BDF8] shadow-[0_0_0_2px_rgba(56,189,248,0.18)]" : "border-[#2D4568]",
                        isToday ? "ring-2 ring-[#22C55E]/55" : "",
                      ].join(" ")}
                    >
                      {schedule ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-[#F8FAFC]">{day}</span>
                            <span
                              className="size-2.5 rounded-full"
                              style={{ background: meta.color }}
                            />
                          </div>
                          <div className={`mt-2 truncate rounded-lg border px-2 py-1 text-[10px] font-bold sm:text-[11px] ${meta.className}`}>
                            {schedule.status === "Hari Kerja" ? schedule.agenda : schedule.status}
                          </div>
                        </>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-[#3B82F6]/30 bg-[linear-gradient(145deg,#172840,#101D31_58%,#0A1324_100%)] p-3 shadow-[0_24px_56px_rgba(0,0,0,0.34),0_0_0_1px_rgba(56,189,248,0.06)]">
              <div className="absolute inset-x-0 top-0 h-px bg-[#38BDF8]/80" />
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <h3 className="text-base font-bold text-[#F8FAFC]">Jadwal Mingguan</h3>
                <p className="text-xs font-semibold text-[#8B9DB5]">
                  Berdasarkan tanggal terpilih
                </p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
              {scheduleState.weekSchedules.map((schedule) => {
                const isToday = schedule.date === scheduleState.todayKey;
                const isSelected = schedule.date === selectedDate;
                const meta = getStatusMeta(schedule.status);

                return (
                  <button
                    key={schedule.date}
                    type="button"
                    onClick={() => setSelectedDate(schedule.date)}
                    className={[
                      "relative overflow-hidden rounded-2xl border bg-[#0D1728] px-3 py-3 text-left transition hover:-translate-y-0.5 hover:bg-[#142136]",
                      isSelected
                        ? "border-[#38BDF8] shadow-[0_0_0_2px_rgba(56,189,248,0.14),0_12px_26px_rgba(56,189,248,0.08)]"
                        : "border-[#2D4568] shadow-[0_10px_24px_rgba(0,0,0,0.16)]",
                    ].join(" ")}
                  >
                    <div className="absolute inset-y-0 left-0 w-1" style={{ background: meta.color }} />
                    <div className="ml-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#F8FAFC]">{schedule.dayName}</p>
                          {isToday ? (
                            <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              Hari ini
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-xs font-semibold text-[#8B9DB5]">
                          {formatDisplayDate(schedule.date, "short")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold text-[#F8FAFC]">
                          {schedule.start === "-" ? "Libur" : `${schedule.start} - ${schedule.end}`}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#A7B3C6]">{schedule.status}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-[#60A5FA]/30 bg-[linear-gradient(145deg,#172840,#101D31_58%,#0A1324_100%)] p-4 shadow-[0_22px_54px_rgba(0,0,0,0.34),0_0_0_1px_rgba(96,165,250,0.06)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#60A5FA,#22D3EE)]" />
              <h3 className="text-lg font-bold text-[#F8FAFC]">Shift Aktif</h3>
              <div className="mt-3 rounded-2xl border border-[#3B82F6]/25 bg-[linear-gradient(145deg,#10203A,#0D1728)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#8B9DB5]">{formatDisplayDate(today, "withDay")}</p>
                    <p className="mt-1 text-xl font-bold text-[#F8FAFC]">
                      {todaySchedule ? (todaySchedule.start === "-" ? "Tidak Ada Jadwal" : `${todaySchedule.start} - ${todaySchedule.end}`) : "Tidak Ada Jadwal"}
                    </p>
                  </div>
                  {todaySchedule ? <StatusBadge status={todaySchedule.status} /> : null}
                </div>
                <p className="mt-2 text-sm leading-5 text-[#A7B3C6]">
                  {todaySchedule && todaySchedule.start !== "-"
                    ? `${todaySchedule.shiftName} - toleransi ${todaySchedule.tolerance} menit.`
                    : "Tidak ada shift aktif hari ini."}
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-[#60A5FA]/30 bg-[linear-gradient(145deg,#172840,#101D31_58%,#0A1324_100%)] p-4 shadow-[0_22px_54px_rgba(0,0,0,0.34),0_0_0_1px_rgba(96,165,250,0.06)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#38BDF8,#A78BFA)]" />
              <h3 className="text-lg font-bold text-[#F8FAFC]">Detail Jadwal Harian</h3>
              {selectedSchedule ? (
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#38BDF8]/35 bg-[linear-gradient(145deg,#10203A,#0D1728)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <p className="font-bold text-[#F8FAFC]">{formatDisplayDate(selectedSchedule.date, "withDay")}</p>
                    <StatusBadge status={selectedSchedule.status} />
                  </div>
                  <div className="space-y-2">
                    <DetailRow label="Shift" value={selectedSchedule.shiftName} Icon={BriefcaseBusiness} />
                    <DetailRow
                      label="Jam Kerja"
                      value={selectedSchedule.start === "-" ? "Tidak Ada Jadwal" : `${selectedSchedule.start} - ${selectedSchedule.end}`}
                      Icon={Clock3}
                    />
                    <DetailRow label="Lokasi Kerja" value={selectedSchedule.location} Icon={MapPin} />
                    <DetailRow label="Agenda" value={selectedSchedule.agenda} Icon={CalendarDays} />
                  </div>
                  <div className="rounded-2xl border border-[#2D4568] bg-[linear-gradient(145deg,#10203A,#0D1728)] px-3 py-2.5">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                      <Info size={14} className="text-[#38BDF8]" />
                      Keterangan
                    </div>
                    <p className="mt-1.5 text-sm leading-5 text-[#F8FAFC]">{selectedSchedule.note}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[#2D4568] bg-[#0D1728] p-5 text-center text-sm text-[#A7B3C6]">
                  <FileQuestion className="mx-auto mb-2 text-[#38BDF8]" size={24} />
                  Pilih tanggal pada kalender untuk melihat detail.
                </div>
              )}
            </div>

          </aside>
        </section>
      </div>
    </EmployeeShell>
  );
}
