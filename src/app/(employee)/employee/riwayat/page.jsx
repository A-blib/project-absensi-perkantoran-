"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Download,
  Image as ImageIcon,
  MapPinned,
  Search,
  X,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { readEmployeeAttendanceRecords } from "@/lib/browser/employee-attendance-store";

const tones = {
  emerald: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  amber: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  sky: "border-sky-300/30 bg-sky-300/10 text-sky-200",
};

function getTone(status) {
  if (status === "Terlambat") return "amber";
  if (status === "Izin") return "sky";
  return "emerald";
}

export default function EmployeeHistoryPage() {
  const [storedRows, setStoredRows] = useState([]);
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStoredRows(readEmployeeAttendanceRecords());
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const rows = useMemo(() => {
    const attendanceRows = storedRows.map((record) => ({
      id: record.id,
      date: record.date,
      clockIn: record.clockIn,
      clockOut: record.clockOut,
      status: record.status,
      tone: getTone(record.status),
      location: record.location,
      photo: record.photo,
      savedAt: record.savedAt,
    }));

    return attendanceRows;
  }, [storedRows]);

  return (
    <EmployeeShell>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Data pribadi</p>
          <h2 className="text-3xl font-semibold text-white">
            Riwayat Absensi
          </h2>
        </div>
        <button
          type="button"
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#6C3CE8] px-5 font-semibold text-white shadow-lg shadow-cyan-400/20 hover:-translate-y-0.5"
        >
          <Download size={18} />
          Download PDF Pribadi
        </button>
      </div>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/10 backdrop-blur-2xl sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-cyan-300/15 bg-[#0A0F2C]/50 px-4 text-sm text-slate-300">
            <CalendarDays size={18} className="text-[#00F0FF]" />
            <input
              type="text"
              defaultValue="01/06/2026 - 30/06/2026"
              className="min-w-0 flex-1 bg-transparent text-slate-100 outline-none"
              aria-label="Filter rentang tanggal"
            />
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-cyan-300/15 bg-[#0A0F2C]/50 px-4 text-sm text-slate-300">
            <Search size={18} className="text-[#00F0FF]" />
            <input
              type="search"
              placeholder="Cari status, tanggal, atau lokasi"
              className="min-w-0 flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
              aria-label="Pencarian riwayat absensi"
            />
          </label>
        </div>

        {rows.length > 0 ? (
        <div className="mt-5 overflow-x-auto pb-2">
          <table className="w-full min-w-[780px] border-separate border-spacing-y-3 text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Tanggal</th>
                <th className="px-4 py-2 font-semibold">Jam Masuk</th>
                <th className="px-4 py-2 font-semibold">Jam Pulang</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Lokasi</th>
                <th className="px-4 py-2 font-semibold">Foto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="group">
                  <td className="rounded-l-2xl border-y border-l border-white/10 bg-[#0A0F2C]/45 px-4 py-4 font-semibold text-white group-hover:border-cyan-300/30">
                    {row.date}
                  </td>
                  <td className="border-y border-white/10 bg-[#0A0F2C]/45 px-4 py-4 font-mono text-cyan-100 group-hover:border-cyan-300/30">
                    {row.clockIn}
                  </td>
                  <td className="border-y border-white/10 bg-[#0A0F2C]/45 px-4 py-4 font-mono text-cyan-100 group-hover:border-cyan-300/30">
                    {row.clockOut}
                  </td>
                  <td className="border-y border-white/10 bg-[#0A0F2C]/45 px-4 py-4 group-hover:border-cyan-300/30">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tones[row.tone]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="border-y border-white/10 bg-[#0A0F2C]/45 px-4 py-4 group-hover:border-cyan-300/30">
                    <a
                      href="https://maps.google.com"
                      className="inline-flex items-center gap-2 text-cyan-200 hover:text-white"
                    >
                      <MapPinned size={15} />
                      {row.location}
                    </a>
                  </td>
                  <td className="rounded-r-2xl border-y border-r border-white/10 bg-[#0A0F2C]/45 px-4 py-4 group-hover:border-cyan-300/30">
                    <button
                      type="button"
                      onClick={() => row.photo && setActivePhoto(row)}
                      disabled={!row.photo}
                      className="grid size-10 place-items-center rounded-xl border border-violet-300/20 bg-violet-300/10 text-violet-100 hover:border-violet-200 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-600"
                      aria-label={`Lihat foto absensi ${row.date}`}
                    >
                      <ImageIcon size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="mt-5 rounded-[24px] border border-dashed border-cyan-300/25 bg-[#0A0F2C]/45 px-5 py-12 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-[#00F0FF]">
              <ImageIcon size={26} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              Riwayat absensi masih kosong
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Data akan muncul otomatis setelah pegawai melakukan Absensi Masuk
              atau Absensi Keluar.
            </p>
          </div>
        )}
      </section>

      {activePhoto ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/75 p-4 backdrop-blur-xl">
          <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-cyan-300/25 bg-[#0A0F2C]/95 shadow-2xl shadow-cyan-400/20">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-sm text-slate-400">Foto absensi</p>
                <h3 className="text-xl font-semibold text-white">
                  {activePhoto.date} - {activePhoto.clockIn}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="grid size-10 place-items-center rounded-2xl border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Tutup foto absensi"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto.photo}
                alt={`Foto absensi ${activePhoto.date}`}
                className="max-h-[70vh] w-full rounded-3xl border border-white/10 object-contain"
              />
              <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                {activePhoto.status} - {activePhoto.location}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </EmployeeShell>
  );
}
