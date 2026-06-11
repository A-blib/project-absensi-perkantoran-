import {
  CalendarDays,
  Clock3,
  Download,
  Moon,
  SunMedium,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();
const currentDate = today.getDate();
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

const weekSchedule = [
  ["Senin", "08:00", "17:00", "Pagi", today.getDay() === 1],
  ["Selasa", "08:00", "17:00", "Pagi", today.getDay() === 2],
  ["Rabu", "08:00", "17:00", "Pagi", today.getDay() === 3],
  ["Kamis", "08:00", "17:00", "Pagi", today.getDay() === 4],
  ["Jumat", "08:00", "16:30", "Pagi", today.getDay() === 5],
  ["Sabtu", "-", "-", "Libur", today.getDay() === 6],
  ["Minggu", "-", "-", "Libur", today.getDay() === 0],
];

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

const calendarDays = getCalendarCells(currentYear, currentMonth);

const markedDays = {
  3: "Meeting",
  8: "Shift",
  12: "Payroll",
  17: "Briefing",
  24: "Audit",
};

export default function EmployeeSchedulePage() {
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
                  {fullMonthNames[currentMonth]} {currentYear}
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
                  {calendarDays.map((day, index) => (
                    <div
                      key={`${day || "empty"}-${index}`}
                      className={[
                        "min-h-[76px] rounded-xl border p-2",
                        day
                          ? "border-[#24344D] bg-[#0B1220]"
                          : "border-transparent bg-transparent",
                        day === currentDate ? "ring-2 ring-[#3b82f6]/60" : "",
                      ].join(" ")}
                    >
                      {day ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#d4e4fa]">
                              {day}
                            </span>
                            {day === currentDate ? (
                              <span className="size-2 rounded-full bg-[#3b82f6]" />
                            ) : null}
                          </div>
                          {markedDays[day] ? (
                            <div className="mt-3 truncate rounded-lg bg-[#3b82f6]/12 px-2 py-1.5 text-[11px] font-semibold text-[#93c5fd]">
                              {markedDays[day]}
                            </div>
                          ) : (
                            <p className="mt-4 text-[11px] text-[#64748b]">
                              Regular
                            </p>
                          )}
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {weekSchedule.slice(0, 6).map(([day, inTime, outTime, shift, today]) => (
              <div
                key={day}
                className={[
                  "glass-panel rounded-3xl p-5 transition hover:-translate-y-1",
                  today ? "border-[#3b82f6]/60 shadow-blue-500/10" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#0B1220] px-3 py-1 text-sm font-semibold text-[#d4e4fa]">
                    {day}
                  </span>
                  {today ? (
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
                        {inTime} - {outTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {shift === "Pagi" ? (
                      <SunMedium size={18} className="text-amber-300" />
                    ) : (
                      <Moon size={18} className="text-[#60a5fa]" />
                    )}
                    <div>
                      <p className="text-xs text-[#8B9DB5]">Shift</p>
                      <p className="font-semibold text-[#c2c6d6]">{shift}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-bold text-[#d4e4fa]">Shift Aktif</h3>
            <div className="mt-5 rounded-3xl border border-[#24344D] bg-[#0B1220] p-5">
              <p className="text-sm text-[#8B9DB5]">Senin - Jumat</p>
              <p className="mt-2 text-3xl font-bold text-[#d4e4fa]">
                08:00 - 17:00
              </p>
              <p className="mt-3 text-sm text-[#8B9DB5]">
                Toleransi keterlambatan 10 menit.
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-bold text-[#d4e4fa]">
              Upcoming Schedule
            </h3>
            <div className="mt-5 space-y-3">
              {[
                ["Briefing Finance", "12 Juni, 09:30"],
                ["Payroll Review", "18 Juni, 13:00"],
                ["Monthly Closing", "28 Juni, 15:00"],
              ].map(([title, time]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-[#24344D] bg-[#0B1220] p-4"
                >
                  <p className="font-semibold text-[#d4e4fa]">{title}</p>
                  <p className="mt-1 text-sm text-[#8B9DB5]">{time}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </EmployeeShell>
  );
}
