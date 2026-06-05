"use client";

import { useState } from "react";
import { FileUp, Send, Timer, CheckCircle2, XCircle } from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";

const requests = [
  ["Cuti", "10/06/2026 - 12/06/2026", "Menunggu", "amber", Timer],
  ["Sakit", "28/05/2026", "Disetujui", "emerald", CheckCircle2],
  ["Izin", "22/05/2026", "Ditolak", "red", XCircle],
];

const tones = {
  amber: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  emerald: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  red: "border-red-300/30 bg-red-300/10 text-red-200",
};

export default function EmployeeLeavePage() {
  const [reason, setReason] = useState("");

  return (
    <EmployeeShell>
      <div className="mb-5">
        <p className="text-sm text-slate-400">Form pegawai</p>
        <h2 className="text-3xl font-semibold text-white">Pengajuan Izin</h2>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <form className="rounded-[28px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/10 backdrop-blur-2xl">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Jenis pengajuan
              </span>
              <select className="mt-2 min-h-12 w-full rounded-2xl border border-cyan-300/15 bg-[#0A0F2C] px-4 text-sm text-slate-100 outline-none">
                <option>Izin</option>
                <option>Sakit</option>
                <option>Cuti</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Tanggal mulai
              </span>
              <input
                type="date"
                className="mt-2 min-h-12 w-full rounded-2xl border border-cyan-300/15 bg-[#0A0F2C] px-4 text-sm text-slate-100 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Tanggal selesai
              </span>
              <input
                type="date"
                className="mt-2 min-h-12 w-full rounded-2xl border border-cyan-300/15 bg-[#0A0F2C] px-4 text-sm text-slate-100 outline-none"
              />
            </label>
            <div className="rounded-2xl border border-dashed border-cyan-300/35 bg-cyan-300/10 p-4">
              <div className="flex min-h-20 items-center justify-center gap-3 text-sm font-semibold text-cyan-100">
                <FileUp size={21} />
                Lampiran dokumen
              </div>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-300">Alasan</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, 240))}
              rows={6}
              className="mt-2 w-full resize-none rounded-2xl border border-cyan-300/15 bg-[#0A0F2C]/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="Tuliskan alasan pengajuan"
            />
            <span className="mt-2 block text-right text-xs text-slate-500">
              {reason.length}/240 karakter
            </span>
          </label>

          <button
            type="button"
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#6C3CE8] px-5 font-semibold text-white shadow-lg shadow-cyan-400/20 hover:-translate-y-0.5"
          >
            <Send size={18} />
            Kirim Pengajuan
          </button>
        </form>

        <aside className="rounded-[28px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/10 backdrop-blur-2xl">
          <h3 className="text-lg font-semibold text-white">
            Status Pengajuan
          </h3>
          <div className="mt-4 grid gap-3">
            {requests.map(([type, date, status, tone, Icon]) => (
              <div
                key={`${type}-${date}`}
                className="rounded-2xl border border-white/10 bg-[#0A0F2C]/45 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{type}</p>
                    <p className="mt-1 text-sm text-slate-400">{date}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}
                  >
                    <Icon size={14} />
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </EmployeeShell>
  );
}
