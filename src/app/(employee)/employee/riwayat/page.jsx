"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Search,
  X,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { readEmployeeAttendanceRecords } from "@/lib/browser/employee-attendance-store";

const fallbackRows = [
  ["Senin, 10 Jun 2026", "08:00 WIB", "17:05 WIB", "Hadir", "Regular Shift"],
  ["Jumat, 07 Jun 2026", "08:14 WIB", "17:02 WIB", "Terlambat", "Regular Shift"],
  ["Kamis, 06 Jun 2026", "08:00 WIB", "16:30 WIB", "Hadir", "Short Shift"],
];

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const fullMonthNames = [
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

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthRange(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return {
    start: toDateInput(new Date(year, month, 1)),
    end: toDateInput(new Date(year, month + 1, 0)),
    month,
    year,
  };
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

function formatDateInput(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function toDateValue(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDateTime(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function parseRowDate(dateText) {
  const slashMatch = dateText.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
  }

  const textMatch = dateText.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!textMatch) return null;

  const [, day, monthLabel, year] = textMatch;
  const monthIndex = monthNames.findIndex((month) =>
    monthLabel.toLowerCase().startsWith(month.toLowerCase()),
  );

  if (monthIndex < 0) return null;
  return new Date(Number(year), monthIndex, Number(day)).getTime();
}

export default function EmployeeHistoryPage() {
  const [storedRows, setStoredRows] = useState([]);
  const [activePhoto, setActivePhoto] = useState(null);
  const [startDate, setStartDate] = useState(() => getMonthRange().start);
  const [endDate, setEndDate] = useState(() => getMonthRange().end);
  const [calendarMonth, setCalendarMonth] = useState(() => getMonthRange().month);
  const [calendarYear, setCalendarYear] = useState(() => getMonthRange().year);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setStoredRows(readEmployeeAttendanceRecords()), 0);
    return () => clearTimeout(timer);
  }, []);

  const rows = useMemo(() => {
    const saved = storedRows.map((record) => ({
      id: record.id,
      date: record.date,
      clockIn: record.clockIn,
      clockOut: record.clockOut,
      status: record.status,
      shift: record.location,
      photo: record.photo,
    }));

    return saved.length
      ? saved
      : fallbackRows.map(([date, clockIn, clockOut, status, shift]) => ({
          id: date,
          date,
          clockIn,
          clockOut,
          status,
          shift,
          photo: null,
        }));
  }, [storedRows]);

  const filteredRows = useMemo(() => {
    const start = getDateTime(startDate);
    const end = getDateTime(endDate || startDate);
    const query = searchTerm.trim().toLowerCase();

    return rows.filter((row) => {
      const rowTime = parseRowDate(row.date);
      const matchesDate =
        rowTime === null || start === null || end === null
          ? true
          : rowTime >= Math.min(start, end) && rowTime <= Math.max(start, end);
      const matchesQuery = query
        ? `${row.date} ${row.clockIn} ${row.clockOut} ${row.status} ${row.shift}`
            .toLowerCase()
            .includes(query)
        : true;

      return matchesDate && matchesQuery;
    });
  }, [rows, startDate, endDate, searchTerm]);

  const calendarCells = useMemo(
    () => getCalendarCells(calendarYear, calendarMonth),
    [calendarYear, calendarMonth],
  );

  function moveCalendar(monthOffset) {
    const nextMonth = new Date(calendarYear, calendarMonth + monthOffset, 1);
    setCalendarMonth(nextMonth.getMonth());
    setCalendarYear(nextMonth.getFullYear());
  }

  function handleCalendarDayClick(day) {
    const value = toDateValue(calendarYear, calendarMonth, day);
    const clicked = getDateTime(value);
    const start = getDateTime(startDate);

    if (!startDate || endDate || clicked < start) {
      setStartDate(value);
      setEndDate("");
      return;
    }

    setEndDate(value);
    setCalendarOpen(false);
  }

  return (
    <EmployeeShell>
      <div className="mx-auto max-w-[1440px] space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold text-[#D4E4FA]">Data Kehadiran</h2>
            <p className="mt-2 text-[#C2C6D6]">
              Review riwayat absensi pribadi dan bukti foto kehadiran.
            </p>
          </div>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#24344D] bg-[#132238] px-6 text-sm font-bold text-[#D4E4FA] hover:bg-white/[0.05]">
            <Download size={17} />
            Export PDF
          </button>
        </div>

        <section className="glass-panel rounded-2xl p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setCalendarOpen((value) => !value)}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-[#24344D] bg-[#0B1220] px-4 text-left text-sm text-[#C2C6D6] transition hover:border-[#3B82F6]/60"
              >
                <CalendarDays size={18} className="text-[#3B82F6]" />
                <span className="min-w-0 flex-1 truncate font-semibold text-[#D4E4FA]">
                  {formatDateInput(startDate)} -{" "}
                  {endDate ? formatDateInput(endDate) : "Pilih tanggal akhir"}
                </span>
              </button>

              {calendarOpen ? (
                <div className="absolute left-0 top-[calc(100%+10px)] z-30 w-full rounded-2xl border border-[#24344D] bg-[#132238] p-4 shadow-2xl shadow-black/35">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#D4E4FA]">
                        {fullMonthNames[calendarMonth]} {calendarYear}
                      </p>
                      <p className="text-xs text-[#8B9DB5]">
                        Pilih tanggal awal dan akhir
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentMonth = getMonthRange();
                        setStartDate(currentMonth.start);
                        setEndDate(currentMonth.end);
                        setCalendarMonth(currentMonth.month);
                        setCalendarYear(currentMonth.year);
                        setCalendarOpen(false);
                      }}
                      className="rounded-lg border border-[#24344D] px-3 py-1 text-xs font-bold text-[#ADC6FF] hover:border-[#3B82F6]"
                    >
                      Bulan ini
                    </button>
                  </div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => moveCalendar(-1)}
                      className="grid size-9 place-items-center rounded-lg border border-[#24344D] bg-[#0B1220] text-[#D4E4FA] hover:border-[#3B82F6]"
                      aria-label="Bulan sebelumnya"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-semibold text-[#8B9DB5]">
                      Kalender mengikuti bulan berjalan secara otomatis
                    </span>
                    <button
                      type="button"
                      onClick={() => moveCalendar(1)}
                      className="grid size-9 place-items-center rounded-lg border border-[#24344D] bg-[#0B1220] text-[#D4E4FA] hover:border-[#3B82F6]"
                      aria-label="Bulan berikutnya"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-[#8B9DB5]">
                    {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                      (day) => (
                        <span key={day} className="py-1">
                          {day}
                        </span>
                      ),
                    )}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-1">
                    {calendarCells.map((day, index) => {
                      const value = day ? toDateValue(calendarYear, calendarMonth, day) : "";
                      const current = getDateTime(value);
                      const start = getDateTime(startDate);
                      const end = getDateTime(endDate || startDate);
                      const inRange =
                        day &&
                        current >= Math.min(start, end) &&
                        current <= Math.max(start, end);
                      const isEdge =
                        day && (value === startDate || value === endDate);

                      return day ? (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleCalendarDayClick(day)}
                          className={[
                            "grid aspect-square place-items-center rounded-lg text-sm font-bold transition",
                            isEdge
                              ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-500/25"
                              : inRange
                                ? "bg-[#3B82F6]/15 text-[#ADC6FF]"
                                : "bg-[#0B1220] text-[#C2C6D6] hover:bg-[#24344D]",
                          ].join(" ")}
                        >
                          {day}
                        </button>
                      ) : (
                        <span key={`empty-${index}`} />
                      );
                    })}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="rounded-xl border border-[#24344D] bg-[#0B1220] px-3 py-2">
                      <span className="text-[10px] font-bold uppercase text-[#8B9DB5]">
                        Mulai
                      </span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        className="mt-1 w-full bg-transparent text-xs font-semibold text-[#D4E4FA] outline-none"
                      />
                    </label>
                    <label className="rounded-xl border border-[#24344D] bg-[#0B1220] px-3 py-2">
                      <span className="text-[10px] font-bold uppercase text-[#8B9DB5]">
                        Akhir
                      </span>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        className="mt-1 w-full bg-transparent text-xs font-semibold text-[#D4E4FA] outline-none"
                      />
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#24344D] bg-[#0B1220] px-4 text-sm text-[#C2C6D6]">
              <Search size={18} className="text-[#3B82F6]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari status, tanggal, atau shift"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#C2C6D6]/50"
              />
            </label>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-[#24344D] text-xs uppercase tracking-wider text-[#C2C6D6]">
                <tr>
                  <th className="px-6 py-5 font-bold">Tanggal</th>
                  <th className="px-6 py-5 font-bold">Jam Masuk</th>
                  <th className="px-6 py-5 font-bold">Jam Pulang</th>
                  <th className="px-6 py-5 font-bold">Status</th>
                  <th className="px-6 py-5 font-bold">Shift</th>
                  <th className="px-6 py-5 font-bold">Foto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-sm">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-white/[0.05]">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#D4E4FA]">{row.date}</span>
                        <span className="text-xs text-[#C2C6D6]">{row.shift}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono text-[#D4E4FA]">{row.clockIn}</td>
                    <td className="px-6 py-5 font-mono text-[#D4E4FA]">{row.clockOut}</td>
                    <td className="px-6 py-5">
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase text-emerald-400">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[#C2C6D6]">{row.shift}</td>
                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => row.photo && setActivePhoto(row)}
                        disabled={!row.photo}
                        className="grid size-10 place-items-center rounded-lg border border-[#24344D] text-[#C2C6D6] disabled:opacity-40"
                      >
                        <ImageIcon size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredRows.length ? (
              <div className="rounded-2xl border border-[#24344D] bg-[#0B1220] p-6 text-center text-sm font-semibold text-[#8B9DB5]">
                Tidak ada riwayat absensi pada rentang tanggal ini.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {activePhoto ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="glass-panel w-full max-w-3xl overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-[#24344D] px-6 py-4">
              <h3 className="text-lg font-bold text-[#D4E4FA]">{activePhoto.date}</h3>
              <button onClick={() => setActivePhoto(null)} className="text-[#C2C6D6]">
                <X size={20} />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activePhoto.photo} alt="Foto absensi" className="max-h-[70vh] w-full object-contain p-5" />
          </div>
        </div>
      ) : null}
    </EmployeeShell>
  );
}
