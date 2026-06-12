import { AdminShell } from "@/features/dashboard/admin-shell";
import { getAttendanceRecap } from "@/server/repositories/attendance-repository";
import { AttendanceRecapTable } from "@/components/tables/attendance-recap-table";
import { DivisionBreakdown, TopLateWidget, AlpaAlertWidget } from "@/features/reports/recap-widgets";
import { Card } from "@/components/ui/card";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileX2,
  ShieldAlert,
  Users,
} from "lucide-react";

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, colorClass, iconBg }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 ${colorClass}`}>
      <div className="pointer-events-none absolute -right-5 -top-5 size-28 rounded-full bg-white/20" />
      <div className="pointer-events-none absolute -right-2 -top-2 size-14 rounded-full bg-white/15" />
      <div className="relative flex items-start justify-between gap-2">
        <div className={`rounded-xl p-2.5 ${iconBg}`}>
          <Icon size={18} aria-hidden="true" />
        </div>
      </div>
      <div className="relative mt-3">
        <p className="text-[11px] font-bold uppercase tracking-widest opacity-55">{label}</p>
        <p className="mt-0.5 text-4xl font-extrabold leading-none tabular-nums">{value}</p>
        {sub && <p className="mt-1.5 text-xs font-medium opacity-60">{sub}</p>}
      </div>
    </div>
  );
}

// ─── DistributionBar ──────────────────────────────────────────────────────────

function DistributionBar({ counts, total }) {
  const segments = [
    { key: "hadir", label: "Hadir",    color: "bg-emerald-500" },
    { key: "telat", label: "Telat",    color: "bg-amber-400" },
    { key: "izin",  label: "Izin/Cuti",color: "bg-cyan-400" },
    { key: "alpa",  label: "Alpa",     color: "bg-red-400" },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800">Distribusi Kehadiran</p>
        <p className="text-xs text-slate-400">{total} total entri</p>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {total > 0 && segments.map(({ key, color }) => (
          counts[key] > 0 && (
            <div
              key={key}
              title={`${key}: ${counts[key]}`}
              className={`h-full ${color} transition-[width] duration-700`}
              style={{ width: `${(counts[key] / total) * 100}%` }}
            />
          )
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {segments.map(({ key, label, color }) => {
          const pct = total > 0 ? Math.round((counts[key] / total) * 100) : 0;
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`size-2.5 rounded-full ${color}`} />
              <span>{label}</span>
              <span className="font-bold text-slate-700">{counts[key]}</span>
              <span className="text-slate-400">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RecapPage() {
  const rows = await getAttendanceRecap();

  const counts = rows.reduce(
    (acc, r) => { if (r.status in acc) acc[r.status]++; return acc; },
    { hadir: 0, telat: 0, izin: 0, alpa: 0 },
  );

  const totalLateMinutes = rows.reduce((s, r) => s + (r.lateMinutes || 0), 0);
  const avgLate    = counts.telat > 0 ? Math.round(totalLateMinutes / counts.telat) : 0;
  const hadirPct   = rows.length > 0  ? Math.round((counts.hadir  / rows.length) * 100) : 0;
  const uniqueDates = new Set(rows.map((r) => r.date)).size;

  return (
    <AdminShell>

      {/* ── Page header ────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
            <CalendarDays size={11} />
            Reports
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
          Rekap Absensi
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Data dari{" "}
          <span className="font-semibold text-slate-700">{uniqueDates} hari kerja</span>
          {" · "}
          <span className="font-semibold text-slate-700">{rows.length} entri</span>
          {" · "}
          tingkat kehadiran{" "}
          <span className={`font-bold ${hadirPct >= 80 ? "text-emerald-600" : hadirPct >= 60 ? "text-amber-600" : "text-red-600"}`}>
            {hadirPct}%
          </span>
        </p>
      </div>

      {/* ── Alpa alert (conditional) ───────────────────────────── */}
      <AlpaAlertWidget data={rows} />

      {/* ── Stat cards ─────────────────────────────────────────── */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={Users}        label="Total Entri"  value={rows.length}
          sub={`${uniqueDates} hari kerja`}
          colorClass="border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700"
          iconBg="bg-slate-200/80 text-slate-600"
        />
        <StatCard
          icon={CheckCircle2} label="Hadir"        value={counts.hadir}
          sub={`${hadirPct}% dari total`}
          colorClass="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/70 text-emerald-800"
          iconBg="bg-emerald-200/80 text-emerald-700"
        />
        <StatCard
          icon={Clock}        label="Telat"        value={counts.telat}
          sub={avgLate > 0 ? `rata-rata ${avgLate} menit` : "—"}
          colorClass="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/70 text-amber-800"
          iconBg="bg-amber-200/80 text-amber-700"
        />
        <StatCard
          icon={FileX2}       label="Izin / Cuti"  value={counts.izin}
          sub="disetujui"
          colorClass="border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100/70 text-cyan-800"
          iconBg="bg-cyan-200/80 text-cyan-700"
        />
        <StatCard
          icon={ShieldAlert}  label="Alpa"         value={counts.alpa}
          sub="tanpa keterangan"
          colorClass="border-red-200 bg-gradient-to-br from-red-50 to-red-100/70 text-red-800"
          iconBg="bg-red-200/80 text-red-700"
        />
      </div>

      {/* ── Distribution bar ───────────────────────────────────── */}
      <div className="mb-6">
        <DistributionBar counts={counts} total={rows.length} />
      </div>

      {/* ── Main layout: table + sidebar widgets ───────────────── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">

        {/* table */}
        <Card className="min-w-0 overflow-hidden">
          <AttendanceRecapTable data={rows} />
        </Card>

        {/* sidebar widgets */}
        <div className="flex flex-col gap-4">
          <TopLateWidget data={rows} />
          <DivisionBreakdown data={rows} />
        </div>

      </div>

    </AdminShell>
  );
}
