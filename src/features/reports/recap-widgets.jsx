"use client";

import { useMemo } from "react";
import { AlertTriangle, Building2, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Division breakdown ───────────────────────────────────────────────────────

export function DivisionBreakdown({ data }) {
  const divStats = useMemo(() => {
    const map = {};
    data.forEach((r) => {
      if (!map[r.division]) map[r.division] = { total: 0, hadir: 0, telat: 0, izin: 0, alpa: 0 };
      map[r.division].total++;
      if (r.status in map[r.division]) map[r.division][r.status]++;
    });
    return Object.entries(map)
      .map(([div, s]) => ({ div, ...s, hadirPct: Math.round((s.hadir / s.total) * 100) }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  const maxTotal = Math.max(...divStats.map((d) => d.total), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-blue-50 p-2">
          <Building2 size={16} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Per Divisi</p>
          <p className="text-xs text-slate-400">Ringkasan kehadiran tiap divisi</p>
        </div>
      </div>

      <div className="space-y-3">
        {divStats.map(({ div, total, hadir, telat, izin, alpa, hadirPct }) => (
          <div key={div}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-xs font-semibold text-slate-700">{div}</span>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[11px] text-slate-400">{total} orang</span>
                <span className={`text-[11px] font-bold ${hadirPct >= 80 ? "text-emerald-600" : hadirPct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                  {hadirPct}%
                </span>
              </div>
            </div>
            {/* stacked bar */}
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-emerald-500"     style={{ width: `${(hadir / maxTotal) * 100}%` }} title={`Hadir: ${hadir}`} />
              <div className="h-full bg-amber-400"       style={{ width: `${(telat / maxTotal) * 100}%` }} title={`Telat: ${telat}`} />
              <div className="h-full bg-cyan-400"        style={{ width: `${(izin  / maxTotal) * 100}%` }} title={`Izin: ${izin}`} />
              <div className="h-full bg-red-400"         style={{ width: `${(alpa  / maxTotal) * 100}%` }} title={`Alpa: ${alpa}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
        {[
          { label: "Hadir",    color: "bg-emerald-500" },
          { label: "Telat",    color: "bg-amber-400" },
          { label: "Izin",     color: "bg-cyan-400" },
          { label: "Alpa",     color: "bg-red-400" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className={`inline-block size-2 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top Late Employees ───────────────────────────────────────────────────────

function stringToColor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const palette = ["#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#6366f1"];
  return palette[Math.abs(hash) % palette.length];
}

export function TopLateWidget({ data }) {
  const topLate = useMemo(() => {
    const map = {};
    data.forEach((r) => {
      if (r.status !== "telat" && r.status !== "alpa") return;
      if (!map[r.name]) map[r.name] = { name: r.name, division: r.division, count: 0, totalMins: 0 };
      map[r.name].count++;
      map[r.name].totalMins += r.lateMinutes || 0;
    });
    return Object.values(map).sort((a, b) => b.count - a.count || b.totalMins - a.totalMins).slice(0, 5);
  }, [data]);

  if (topLate.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-red-50 p-2">
          <TrendingDown size={16} className="text-red-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Perlu Perhatian</p>
          <p className="text-xs text-slate-400">Pegawai dengan telat / alpa terbanyak</p>
        </div>
      </div>

      <ol className="space-y-2.5">
        {topLate.map((emp, i) => (
          <li key={emp.name} className="flex items-center gap-3">
            <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${i === 0 ? "bg-red-500" : i === 1 ? "bg-orange-400" : i === 2 ? "bg-amber-400" : "bg-slate-300"}`}>
              {i + 1}
            </span>
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: stringToColor(emp.name) }}
            >
              {emp.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">{emp.name}</p>
              <p className="truncate text-[11px] text-slate-400">{emp.division}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-bold text-red-600">{emp.count}×</p>
              {emp.totalMins > 0 && (
                <p className="text-[11px] text-slate-400">{emp.totalMins}m</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Alpa Alert ───────────────────────────────────────────────────────────────

export function AlpaAlertWidget({ data }) {
  const alpaToday = useMemo(() => {
    const dates = [...new Set(data.map((r) => r.date))].sort().reverse();
    const latest = dates[0];
    return data.filter((r) => r.date === latest && r.status === "alpa");
  }, [data]);

  if (alpaToday.length === 0) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-600" />
        <p className="text-sm font-bold text-red-700">
          {alpaToday.length} Pegawai Alpa Hari Ini
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {alpaToday.map((r) => (
          <span key={r.id} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
            {r.name}
            <span className="text-red-400">· {r.division}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
