"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileQuestion,
  MapPin,
  Search,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import {
  formatDateKey,
  formatDisplayDate,
  getJakartaDate,
  getSchedules,
  getStatusMeta,
  isActivity,
  monthNames,
} from "@/lib/schedules/work-schedule";

const statusOptions = ["Semua", "Meeting", "Training", "Audit", "Work From Home", "Overtime"];

function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
      {status}
    </span>
  );
}

export default function UpcomingActivitiesPage() {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = getJakartaDate();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [search, setSearch] = useState("");

  const pageState = useMemo(() => {
    const todayKey = formatDateKey(getJakartaDate());
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const schedules = getSchedules(year, month);
    const activities = schedules
      .filter((schedule) => schedule.date > todayKey && isActivity(schedule))
      .filter((schedule) => statusFilter === "Semua" || schedule.status === statusFilter)
      .filter((schedule) => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return true;
        return [schedule.agenda, schedule.status, schedule.location, schedule.note]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      activities,
      monthLabel: `${monthNames[month]} ${year}`,
    };
  }, [visibleMonth, statusFilter, search]);

  function changeMonth(direction) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  return (
    <EmployeeShell>
      <div className="mx-auto max-w-[1320px] space-y-3 pb-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#A7B3C6]">Work schedule activities</p>
            <h2 className="mt-1 text-2xl font-bold text-[#F8FAFC]">
              Upcoming Activities
            </h2>
            <p className="mt-1 text-sm text-[#A7B3C6]">
              Daftar agenda kerja mendatang yang diturunkan dari jadwal bulan aktif.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/employee/jadwal"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#2D4568] bg-[#142136] px-3 text-sm font-bold text-[#F8FAFC] transition hover:bg-[#223754]"
            >
              <ChevronLeft size={16} />
              Jadwal Kerja
            </Link>
            <div className="grid grid-cols-2 rounded-xl border border-[#2D4568] bg-[#0D1728] p-1">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold text-[#F8FAFC] transition hover:bg-[#223754]"
              >
                <ChevronLeft size={16} />
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold text-[#F8FAFC] transition hover:bg-[#223754]"
              >
                Berikutnya
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[20px] border border-[#3B82F6]/30 bg-[linear-gradient(145deg,#15233A_0%,#101D31_54%,#0B1424_100%)] p-3.5 shadow-[0_18px_46px_rgba(0,0,0,0.34)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#38BDF8,#A78BFA,#22C55E,#F59E0B)]" />
          <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">{pageState.monthLabel}</h3>
              <p className="text-sm text-[#A7B3C6]">
                {pageState.activities.length} agenda mendatang ditemukan.
              </p>
            </div>
            <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_160px] lg:min-w-[500px]">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#CBD5E1]">
                  Search
                </span>
                <span className="flex h-10 items-center gap-3 rounded-xl border border-[#2D4568] bg-[#0D1728] px-3 text-sm text-[#94A3B8] transition focus-within:border-[#38BDF8] hover:border-[#38BDF8]">
                  <Search size={17} className="text-[#38BDF8]" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari agenda atau lokasi"
                    className="min-w-0 flex-1 bg-transparent text-[#F8FAFC] outline-none placeholder:text-[#94A3B8]"
                  />
                </span>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#CBD5E1]">
                  Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#2D4568] bg-[#0D1728] px-3 text-sm font-semibold text-[#F8FAFC] outline-none transition hover:border-[#38BDF8] focus:border-[#38BDF8]"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="relative mt-3 grid gap-2.5 lg:grid-cols-2">
            {pageState.activities.map((activity) => {
              const meta = getStatusMeta(activity.status);
              return (
                <article
                  key={`${activity.date}-${activity.agenda}`}
                  className="relative overflow-hidden rounded-[16px] border border-[#2D4568] bg-[#0D1728] p-3 shadow-[0_12px_28px_rgba(0,0,0,0.22)]"
                >
                  <div className="absolute inset-y-0 left-0 w-1" style={{ background: meta.color }} />
                  <div className="ml-1.5 grid gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-extrabold text-[#F8FAFC]">{activity.agenda}</h4>
                        <StatusBadge status={activity.status} />
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#A7B3C6]">
                        <CalendarDays size={16} className="text-[#38BDF8]" />
                        {formatDisplayDate(activity.date, "withDay")}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#CBD5E1]">{activity.note}</p>
                    </div>
                    <div className="grid gap-2 rounded-xl border border-[#2D4568] bg-[#142136] p-2.5 text-sm sm:grid-cols-2">
                      <p className="flex items-center gap-2 font-bold text-[#F8FAFC]">
                        <Clock3 size={15} className="text-[#60A5FA]" />
                        {activity.start === "-" ? "Tidak Ada Jadwal" : `${activity.start} - ${activity.end}`}
                      </p>
                      <p className="flex items-center gap-2 text-[#A7B3C6]">
                        <MapPin size={15} className="text-[#60A5FA]" />
                        {activity.location}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}

            {!pageState.activities.length ? (
              <div className="rounded-2xl border border-dashed border-[#2D4568] bg-[#0D1728] p-8 text-center lg:col-span-2">
                <FileQuestion className="mx-auto mb-3 text-[#38BDF8]" size={30} />
                <p className="font-bold text-[#F8FAFC]">Tidak ada upcoming activities.</p>
                <p className="mt-1 text-sm text-[#A7B3C6]">
                  Coba ubah filter atau pindah ke bulan lain.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </EmployeeShell>
  );
}
