import { CalendarDays, Clock3, Moon, SunMedium } from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";

const days = [
  ["Senin", "08:00", "17:00", "Pagi", true],
  ["Selasa", "08:00", "17:00", "Pagi", false],
  ["Rabu", "08:00", "17:00", "Pagi", false],
  ["Kamis", "08:00", "17:00", "Pagi", false],
  ["Jumat", "08:00", "16:30", "Pagi", false],
];

export default function EmployeeSchedulePage() {
  return (
    <EmployeeShell>
      <div className="mb-5">
        <p className="text-sm text-slate-400">Shift aktif</p>
        <h2 className="text-3xl font-semibold text-white">Jadwal Kerja</h2>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {days.map(([day, inTime, outTime, shift, today]) => (
          <div
            key={day}
            className={[
              "rounded-[26px] border bg-white/[0.07] p-5 shadow-xl shadow-black/10 backdrop-blur-2xl hover:-translate-y-1",
              today
                ? "border-cyan-300/55 shadow-cyan-400/15"
                : "border-white/10 hover:border-cyan-300/35",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-white/10 bg-[#0A0F2C]/50 px-3 py-1 text-sm font-semibold text-white">
                {day}
              </span>
              {today ? (
                <span className="size-2.5 rounded-full bg-[#00F0FF] shadow-[0_0_16px_rgba(0,240,255,0.9)]" />
              ) : null}
            </div>
            <div className="mt-7 grid gap-4">
              <div className="flex items-center gap-3">
                <Clock3 size={19} className="text-[#00F0FF]" />
                <div>
                  <p className="text-xs text-slate-400">Jam masuk</p>
                  <p className="font-mono text-lg font-semibold text-cyan-100">
                    {inTime}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays size={19} className="text-violet-200" />
                <div>
                  <p className="text-xs text-slate-400">Jam pulang</p>
                  <p className="font-mono text-lg font-semibold text-violet-100">
                    {outTime}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {shift === "Pagi" ? (
                  <SunMedium size={19} className="text-amber-200" />
                ) : (
                  <Moon size={19} className="text-sky-200" />
                )}
                <div>
                  <p className="text-xs text-slate-400">Shift kerja</p>
                  <p className="font-semibold text-white">{shift}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </EmployeeShell>
  );
}
