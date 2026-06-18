"use client";

import { createPortal } from "react-dom";
import { X, Clock, MapPin, Calendar, Timer, User, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { attendanceStatuses } from "@/lib/constants/status";

function calcDuration(checkIn, checkOut) {
  if (!checkIn || !checkOut || checkIn === "-" || checkOut === "-") return null;
  const [h1, m1] = checkIn.split(":").map(Number);
  const [h2, m2] = checkOut.split(":").map(Number);
  const total = h2 * 60 + m2 - (h1 * 60 + m1);
  if (total <= 0) return null;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h} jam ${m > 0 ? `${m} menit` : ""}`.trim();
}

function stringToColor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const palette = ["#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#6366f1"];
  return palette[Math.abs(hash) % palette.length];
}

function DetailRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
      <div className="mt-0.5 rounded-lg bg-white p-1.5 shadow-sm">
        <Icon size={14} className="text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`mt-0.5 text-sm font-semibold text-slate-800 ${mono ? "font-mono" : ""}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export function AttendanceDetailDrawer({ row, onClose }) {
  if (!row) return null;

  const status = attendanceStatuses[row.status];
  const duration = calcDuration(row.checkIn, row.checkOut);
  const color = stringToColor(row.name);

  const content = (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* backdrop */}
      <button
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Tutup detail"
      />

      {/* panel */}
      <aside className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-bold text-slate-700">Detail Absensi</p>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* employee hero */}
        <div className="flex flex-col items-center gap-3 px-5 py-7">
          <div
            className="flex size-20 items-center justify-center rounded-full text-3xl font-extrabold text-white shadow-lg"
            style={{ background: color }}
          >
            {row.name.charAt(0)}
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold text-slate-900">{row.name}</p>
            <p className="mt-0.5 text-sm text-slate-500">{row.division}</p>
          </div>
          <Badge status={row.status}>{status?.label ?? row.status}</Badge>
        </div>

        {/* detail grid */}
        <div className="grid gap-2 px-5 pb-8">
          <DetailRow icon={Calendar}  label="Tanggal"         value={row.date} />
          <DetailRow icon={Clock}     label="Jam Masuk"       value={row.checkIn === "-" ? "Tidak hadir" : row.checkIn}  mono />
          <DetailRow icon={Clock}     label="Jam Pulang"      value={row.checkOut === "-" ? "Tidak hadir" : row.checkOut} mono />
          <DetailRow icon={Timer}     label="Durasi Kerja"    value={duration ?? "Tidak tersedia"} />
          {row.lateMinutes > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="mt-0.5 rounded-lg bg-white p-1.5 shadow-sm">
                <Timer size={14} className="text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">Keterlambatan</p>
                <p className="mt-0.5 text-sm font-bold text-amber-700">{row.lateMinutes} menit</p>
              </div>
            </div>
          )}
          <DetailRow icon={MapPin}    label="Lokasi"          value={row.location === "-" ? "Tidak tersedia" : row.location} />
          <DetailRow icon={User}      label="ID Absensi"      value={row.id} mono />
          <DetailRow icon={Building2} label="Divisi"          value={row.division} />
        </div>

        {/* status footer */}
        <div className={`mx-5 mb-5 rounded-xl border p-4 text-center text-sm font-semibold ${status?.className ?? ""}`}>
          {row.status === "hadir"  && "✅ Pegawai hadir tepat waktu"}
          {row.status === "telat"  && `⚠️ Pegawai terlambat ${row.lateMinutes} menit`}
          {row.status === "izin"   && "📋 Pegawai sedang izin / cuti"}
          {row.status === "alpa"   && "❌ Pegawai tidak hadir tanpa keterangan"}
        </div>
      </aside>
    </div>
  );

  return createPortal(content, document.body);
}
