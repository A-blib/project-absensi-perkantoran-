"use client";

/* eslint-disable react-hooks/incompatible-library */

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FilterX,
  Printer,
  Search,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { attendanceStatuses } from "@/lib/constants/status";
import { AttendanceDetailDrawer } from "@/features/reports/attendance-detail-drawer";

// ─── constants ───────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: "all",   label: "Semua" },
  { key: "hadir", label: "Hadir" },
  { key: "telat", label: "Telat" },
  { key: "izin",  label: "Izin/Cuti" },
  { key: "alpa",  label: "Alpa" },
];

const ROW_CLASS = {
  hadir: "hover:bg-emerald-50/50 border-l-[3px] border-l-emerald-400",
  telat: "hover:bg-amber-50/50  border-l-[3px] border-l-amber-400",
  izin:  "hover:bg-cyan-50/50   border-l-[3px] border-l-cyan-400",
  alpa:  "bg-red-50/30 hover:bg-red-50/60 border-l-[3px] border-l-red-500",
};

const PAGE_SIZES = [10, 25, 50];

// ─── helpers ─────────────────────────────────────────────────────────────────

function calcDuration(checkIn, checkOut) {
  if (!checkIn || !checkOut || checkIn === "-" || checkOut === "-") return null;
  const [h1, m1] = checkIn.split(":").map(Number);
  const [h2, m2] = checkOut.split(":").map(Number);
  const total = h2 * 60 + m2 - (h1 * 60 + m1);
  if (total <= 0) return null;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}j${m > 0 ? ` ${m}m` : ""}`;
}

function exportToCsv(rows) {
  const headers = ["No", "ID", "Pegawai", "Divisi", "Tanggal", "Masuk", "Pulang", "Durasi", "Status", "Telat (menit)", "Lokasi"];
  const lines = [
    headers.join(","),
    ...rows.map((r, i) => {
      const o = r.original;
      return [
        i + 1, o.id, `"${o.name}"`, `"${o.division}"`, `"${o.date}"`,
        o.checkIn, o.checkOut,
        calcDuration(o.checkIn, o.checkOut) ?? "-",
        o.status, o.lateMinutes, `"${o.location}"`,
      ].join(",");
    }),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `rekap-absensi-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function stringToColor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const palette = ["#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#6366f1"];
  return palette[Math.abs(hash) % palette.length];
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SortIcon({ column }) {
  const s = column.getIsSorted();
  if (!s) return <ArrowUpDown size={12} className="text-slate-400" />;
  return s === "asc"
    ? <ArrowUp   size={12} className="text-blue-500" />
    : <ArrowDown size={12} className="text-blue-500" />;
}

function ProgressBar({ value, max, colorClass }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
      <div className={`h-full rounded-full ${colorClass} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatusCard({ statusKey, count, total, isActive, onClick }) {
  const info = attendanceStatuses[statusKey];
  const barColor = { hadir: "bg-emerald-500", telat: "bg-amber-500", izin: "bg-cyan-500", alpa: "bg-red-500" }[statusKey];
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <button
      onClick={onClick}
      className={`group relative w-full rounded-xl border p-4 text-left transition-all duration-200 ${info.className} ${isActive ? "shadow-md ring-2 ring-current ring-offset-1" : "opacity-70 hover:opacity-100 hover:shadow-sm"}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">{info.label}</p>
          <p className="mt-0.5 text-3xl font-extrabold leading-none tabular-nums">{count}</p>
        </div>
        <span className="rounded-md bg-white/60 px-1.5 py-0.5 text-xs font-bold">{pct}%</span>
      </div>
      <ProgressBar value={count} max={total} colorClass={barColor} />
    </button>
  );
}

function ActiveFilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 pl-2.5 pr-1.5 py-1 text-xs font-semibold text-blue-700">
      {label}
      <button onClick={onRemove} className="rounded-full p-0.5 hover:bg-blue-200" aria-label={`Hapus filter ${label}`}>
        <X size={11} />
      </button>
    </span>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function AttendanceRecapTable({ data }) {
  const [globalFilter,    setGlobalFilter]    = useState("");
  const [statusFilter,    setStatusFilter]    = useState("all");
  const [divisionFilter,  setDivisionFilter]  = useState("all");
  const [sorting,         setSorting]         = useState([]);
  const [pageSize,        setPageSize]        = useState(10);
  const [selectedRow,     setSelectedRow]     = useState(null);
  const [pageIndex,       setPageIndex]       = useState(0);

  const divisions = useMemo(() => {
    const set = new Set(data.map((r) => r.division).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [data]);

  const summary = useMemo(() => {
    const c = { hadir: 0, telat: 0, izin: 0, alpa: 0 };
    data.forEach((r) => { if (r.status in c) c[r.status]++; });
    return c;
  }, [data]);

  const hasActiveFilter = statusFilter !== "all" || divisionFilter !== "all" || globalFilter.trim() !== "";

  const resetFilters = useCallback(() => {
    setStatusFilter("all");
    setDivisionFilter("all");
    setGlobalFilter("");
    setPageIndex(0);
  }, []);

  const filteredData = useMemo(() =>
    data.filter((r) => {
      if (statusFilter  !== "all" && r.status   !== statusFilter)   return false;
      if (divisionFilter !== "all" && r.division !== divisionFilter) return false;
      return true;
    }), [data, statusFilter, divisionFilter]);

  const columns = useMemo(() => [
    {
      id: "no",
      header: "#",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums text-xs text-slate-400">
          {pageIndex * pageSize + row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Pegawai",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
            style={{ background: stringToColor(row.original.name) }}
            aria-hidden="true"
          >
            {row.original.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{row.original.name}</p>
            <p className="truncate text-[11px] text-slate-400">{row.original.division}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Tanggal",
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap text-sm text-slate-600">{getValue()}</span>
      ),
    },
    {
      accessorKey: "checkIn",
      header: "Masuk",
      enableSorting: false,
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v || v === "-") return <span className="text-slate-300">—</span>;
        return <span className="font-mono text-sm font-medium text-slate-700">{v}</span>;
      },
    },
    {
      accessorKey: "checkOut",
      header: "Pulang",
      enableSorting: false,
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v || v === "-") return <span className="text-slate-300">—</span>;
        return <span className="font-mono text-sm font-medium text-slate-700">{v}</span>;
      },
    },
    {
      id: "duration",
      header: "Durasi",
      enableSorting: false,
      cell: ({ row }) => {
        const d = calcDuration(row.original.checkIn, row.original.checkOut);
        if (!d) return <span className="text-slate-300">—</span>;
        return (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
            {d}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
      cell: ({ getValue }) => {
        const s = getValue();
        return <Badge status={s}>{attendanceStatuses[s]?.label ?? s}</Badge>;
      },
    },
    {
      accessorKey: "lateMinutes",
      header: "Telat",
      enableSorting: true,
      cell: ({ getValue }) => {
        const m = getValue();
        if (!m) return <span className="text-slate-300">—</span>;
        return (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
            {m}m
          </span>
        );
      },
    },
    {
      accessorKey: "location",
      header: "Lokasi",
      enableSorting: false,
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v || v === "-") return <span className="text-slate-300">—</span>;
        const remote = v.toLowerCase().includes("remote");
        return (
          <span className={`text-xs font-medium ${remote ? "text-violet-600" : "text-slate-500"}`}>
            {remote && <span className="mr-1">🏠</span>}
            {v}
          </span>
        );
      },
    },
  ], [pageIndex, pageSize]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, sorting, pagination: { pageIndex, pageSize } },
    onGlobalFilterChange: (v) => { setGlobalFilter(v); setPageIndex(0); },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
      setPageSize(next.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: false,
  });

  const visibleRows   = table.getRowModel().rows;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const startRow      = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow        = Math.min(startRow + pageSize - 1, totalFiltered);
  const pageCount     = table.getPageCount();

  return (
    <>
      <AttendanceDetailDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />

      <div className="flex flex-col">

        {/* ── Status cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-5 sm:grid-cols-4">
          {Object.keys(summary).map((key) => (
            <StatusCard
              key={key}
              statusKey={key}
              count={summary[key]}
              total={data.length}
              isActive={statusFilter === key}
              onClick={() => { setStatusFilter(statusFilter === key ? "all" : key); setPageIndex(0); }}
            />
          ))}
        </div>

        {/* ── Toolbar ──────────────────────────────────────────── */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 space-y-3">

          {/* status tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setStatusFilter(t.key); setPageIndex(0); }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === t.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-blue-700 hover:ring-blue-300"
                }`}
              >
                {t.label}
                {t.key !== "all" && (
                  <span className={`ml-1 rounded-full px-1.5 text-[10px] font-bold ${statusFilter === t.key ? "bg-white/25" : "bg-slate-100"}`}>
                    {summary[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* search row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* search */}
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-200">
              <Search size={14} className="shrink-0 text-slate-400" />
              <input
                value={globalFilter ?? ""}
                onChange={(e) => { setGlobalFilter(e.target.value); setPageIndex(0); }}
                placeholder="Cari nama, divisi, lokasi..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              {globalFilter && (
                <button onClick={() => setGlobalFilter("")} className="shrink-0 text-slate-400 hover:text-slate-700">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* divisi */}
            <select
              value={divisionFilter}
              onChange={(e) => { setDivisionFilter(e.target.value); setPageIndex(0); }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
            >
              {divisions.map((d) => (
                <option key={d} value={d}>{d === "all" ? "Semua Divisi" : d}</option>
              ))}
            </select>

            {/* page size */}
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} baris</option>)}
            </select>

            {/* print */}
            <Button variant="outline" size="sm" onClick={() => window.print()} className="shrink-0 gap-1.5">
              <Printer size={14} />
              <span className="hidden sm:inline">Cetak</span>
            </Button>

            {/* export */}
            <Button
              variant="outline" size="sm"
              onClick={() => exportToCsv(table.getFilteredRowModel().rows)}
              className="shrink-0 gap-1.5"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>

          {/* active filter chips */}
          {hasActiveFilter && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400">Filter aktif:</span>
              {statusFilter !== "all" && (
                <ActiveFilterChip
                  label={`Status: ${attendanceStatuses[statusFilter]?.label}`}
                  onRemove={() => { setStatusFilter("all"); setPageIndex(0); }}
                />
              )}
              {divisionFilter !== "all" && (
                <ActiveFilterChip
                  label={`Divisi: ${divisionFilter}`}
                  onRemove={() => { setDivisionFilter("all"); setPageIndex(0); }}
                />
              )}
              {globalFilter && (
                <ActiveFilterChip
                  label={`"${globalFilter}"`}
                  onRemove={() => { setGlobalFilter(""); setPageIndex(0); }}
                />
              )}
              <button onClick={resetFilters} className="text-xs font-semibold text-red-500 hover:underline ml-1">
                Hapus semua
              </button>
            </div>
          )}
        </div>

        {/* ── Table ────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-slate-200">
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={`px-4 py-3 font-bold first:pl-5 last:pr-5 ${canSort ? "cursor-pointer select-none hover:bg-slate-100 hover:text-blue-700" : ""}`}
                      >
                        <div className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && <SortIcon column={header.column} />}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-slate-100">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-16 text-center">
                    <p className="text-base font-semibold text-slate-600">Tidak ada data ditemukan</p>
                    <p className="mt-1 text-sm text-slate-400">Coba ubah filter atau kata kunci.</p>
                    {hasActiveFilter && (
                      <button onClick={resetFilters} className="mt-3 text-sm font-semibold text-blue-600 hover:underline">
                        Reset semua filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRow(row.original)}
                    className={`cursor-pointer transition-colors ${ROW_CLASS[row.original.status] ?? "hover:bg-slate-50"}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5 first:pl-5 last:pr-5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer / Pagination ──────────────────────────────── */}
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {totalFiltered === 0
              ? "Tidak ada hasil"
              : `Menampilkan ${startRow}–${endRow} dari ${totalFiltered} data`}
            {hasActiveFilter && totalFiltered !== data.length && (
              <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                dari {data.length} total
              </span>
            )}
          </p>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPageIndex(0)}               disabled={pageIndex === 0}                  aria-label="Pertama"><ChevronsLeft  size={14} /></Button>
            <Button variant="outline" size="sm" onClick={() => setPageIndex((p) => p - 1)}    disabled={pageIndex === 0}                  aria-label="Sebelumnya"><ChevronLeft size={14} /></Button>

            <div className="flex items-center gap-1 px-1">
              {(() => {
                const pages = [];
                const total = pageCount;
                const cur   = pageIndex;
                let start = Math.max(0, cur - 2);
                let end   = Math.min(total - 1, cur + 2);
                if (cur < 2)           end   = Math.min(total - 1, 4);
                if (cur > total - 3)   start = Math.max(0, total - 5);
                for (let p = start; p <= end; p++) {
                  pages.push(
                    <button
                      key={p}
                      onClick={() => setPageIndex(p)}
                      className={`size-8 rounded-lg text-xs font-semibold transition ${p === cur ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-blue-700 hover:ring-blue-300"}`}
                    >
                      {p + 1}
                    </button>
                  );
                }
                return pages;
              })()}
            </div>

            <Button variant="outline" size="sm" onClick={() => setPageIndex((p) => p + 1)}    disabled={pageIndex >= pageCount - 1}       aria-label="Berikutnya"><ChevronRight  size={14} /></Button>
            <Button variant="outline" size="sm" onClick={() => setPageIndex(pageCount - 1)}   disabled={pageIndex >= pageCount - 1}       aria-label="Terakhir"><ChevronsRight   size={14} /></Button>
          </div>
        </div>

      </div>
    </>
  );
}
