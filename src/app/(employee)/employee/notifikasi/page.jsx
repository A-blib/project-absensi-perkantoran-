"use client";

import { useState } from "react";
import {
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  Info,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";

const initialNotifications = [
  ["Absensi berhasil", "Absensi masuk tercatat pukul 08:00:22 WIB", "2 menit lalu", "emerald", CheckCircle2],
  ["Terlambat masuk", "Kamu terlambat 14 menit pada 04/06/2026", "kemarin", "amber", TriangleAlert],
  ["Izin disetujui", "Pengajuan sakit tanggal 28/05/2026 disetujui admin", "1 minggu lalu", "sky", ClipboardCheck],
  ["Izin ditolak", "Pengajuan izin tanggal 22/05/2026 perlu revisi alasan", "2 minggu lalu", "red", XCircle],
  ["Informasi dari admin", "Briefing divisi dilakukan Jumat pukul 09:00 WIB", "3 minggu lalu", "slate", Info],
];

const tones = {
  emerald: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  amber: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  sky: "border-sky-300/30 bg-sky-300/10 text-sky-200",
  red: "border-red-300/30 bg-red-300/10 text-red-200",
  slate: "border-slate-300/20 bg-slate-300/10 text-slate-200",
};

export default function EmployeeNotificationsPage() {
  const [readAll, setReadAll] = useState(false);

  return (
    <EmployeeShell>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Pusat pesan</p>
          <h2 className="text-3xl font-semibold text-white">Notifikasi</h2>
        </div>
        <button
          type="button"
          onClick={() => setReadAll(true)}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-5 font-semibold text-cyan-100 hover:border-cyan-200"
        >
          <BellRing size={18} />
          Tandai semua telah dibaca
        </button>
      </div>

      <section className="grid gap-3">
        {initialNotifications.map(([title, body, time, tone, Icon], index) => (
          <div
            key={title}
            className="flex gap-4 rounded-[24px] border border-white/10 bg-white/[0.07] p-4 shadow-xl shadow-black/10 backdrop-blur-2xl hover:border-cyan-300/30"
          >
            <div
              className={`grid size-12 shrink-0 place-items-center rounded-2xl border ${tones[tone]}`}
            >
              <Icon size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-white">{title}</p>
                {!readAll && index < 2 ? (
                  <span className="size-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-400">{body}</p>
              <p className="mt-2 text-xs text-slate-500">{time}</p>
            </div>
          </div>
        ))}
      </section>
    </EmployeeShell>
  );
}
