"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileQuestion,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  X,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { readEmployeeAttendanceRecords } from "@/lib/browser/employee-attendance-store";

const PAGE_SIZE = 10;
const DEFAULT_FILTERS = {
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  status: "Semua",
  shift: "Semua",
  search: "",
};

const months = [
  ["1", "Januari"],
  ["2", "Februari"],
  ["3", "Maret"],
  ["4", "April"],
  ["5", "Mei"],
  ["6", "Juni"],
  ["7", "Juli"],
  ["8", "Agustus"],
  ["9", "September"],
  ["10", "Oktober"],
  ["11", "November"],
  ["12", "Desember"],
];

const statusOptions = ["Semua", "Hadir", "Terlambat", "Izin", "Sakit", "Tidak Hadir"];
const shiftOptions = ["Semua", "Regular Shift"];

const statusClasses = {
  Hadir: "border border-[rgba(45,212,191,0.38)] bg-[rgba(45,212,191,0.14)] text-[#2DD4BF]",
  Terlambat: "border border-[rgba(250,204,21,0.38)] bg-[rgba(250,204,21,0.14)] text-[#FACC15]",
  "Belum Pulang": "border border-[rgba(251,146,60,0.35)] bg-[rgba(251,146,60,0.16)] text-[#FB923C]",
  "Tidak Hadir": "border border-[rgba(251,113,133,0.38)] bg-[rgba(251,113,133,0.14)] text-[#FB7185]",
  Izin: "border border-[rgba(96,165,250,0.38)] bg-[rgba(96,165,250,0.14)] text-[#60A5FA]",
  Sakit: "border border-[rgba(96,165,250,0.38)] bg-[rgba(96,165,250,0.14)] text-[#60A5FA]",
  "Belum Absen": "border border-[rgba(96,165,250,0.38)] bg-[rgba(96,165,250,0.14)] text-[#60A5FA]",
  "Sedang Bekerja": "border border-[rgba(45,212,191,0.38)] bg-[rgba(45,212,191,0.14)] text-[#2DD4BF]",
};

function formatLongDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatExportDate() {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function MissingClock() {
  return (
    <span className="inline-flex rounded-lg border border-[#2D4568] bg-[#0D1728] px-2.5 py-1 font-mono text-xs font-bold text-[#94A3B8]">
      --:--:--
    </span>
  );
}

function PhotoPreview({ src, alt, emptyMessage }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="grid min-h-52 place-items-center p-5 text-center text-sm font-semibold text-[#A7B3C6]">
        {hasError ? "URL foto rusak atau foto tidak ada di storage" : emptyMessage}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="max-h-[60vh] w-full object-contain p-3"
    />
  );
}

function mergeLocalAttendancePhotos(rows) {
  const localRows = readEmployeeAttendanceRecords();
  if (!localRows.length) return rows;

  const localByDate = new Map(
    localRows
      .map((record) => [record.dateValue || record.date, record])
      .filter(([dateValue]) => Boolean(dateValue)),
  );

  return rows.map((row) => {
    const local = localByDate.get(row.dateValue);
    if (!local) return row;

    const hasLocalClockOut = Boolean(local.clockOut && local.clockOut !== "--:--:--");

    return {
      ...row,
      photo: row.photo || local.photo || null,
      outPhoto: row.outPhoto || local.outPhoto || null,
      hasCheckedOut: row.hasCheckedOut || hasLocalClockOut || Boolean(local.outPhoto),
    };
  });
}

function SelectFilter({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#CBD5E1]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[#2D4568] bg-[#0D1728] px-3 text-sm font-semibold text-[#F8FAFC] outline-none transition hover:border-[#38BDF8] focus:border-[#38BDF8] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.12)]"
      >
        {children}
      </select>
    </label>
  );
}

function SummaryCard({ label, value, Icon, color }) {
  return (
    <div
      className="group relative min-h-[104px] overflow-hidden rounded-2xl border border-[rgba(96,165,250,0.22)] bg-[linear-gradient(145deg,#17243A,#101A2B)] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.28)] transition duration-200 ease-in-out hover:-translate-y-0.5 hover:border-[rgba(56,189,248,0.38)]"
      style={{ "--accent": color, boxShadow: `0 12px 30px rgba(0,0,0,.28), 0 0 22px ${color}16` }}
    >
      <div className="absolute bottom-0 left-0 top-0 w-1 rounded-r-full" style={{ background: color }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#AEBBD0]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-extrabold" style={{ color }}>
            {value}
          </p>
        </div>
        <div
          className="grid size-11 place-items-center rounded-xl border border-white/5"
          style={{ background: `${color}1F` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function EmployeeHistoryPage() {
  const [rows, setRows] = useState([]);
  const [years, setYears] = useState([new Date().getFullYear()]);
  const [summary, setSummary] = useState({
    hadir: 0,
    terlambat: 0,
    izin: 0,
    tidakHadir: 0,
  });
  const [employee, setEmployee] = useState({ name: "Karyawan" });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startItem = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endItem = Math.min(page * PAGE_SIZE, total);
  const periodLabel = `${months.find(([value]) => value === filters.month)?.[1] || "Semua Bulan"} ${filters.year}`;

  const fetchRows = useCallback(async ({ signal } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      month: filters.month,
      year: filters.year,
      status: filters.status,
      shift: filters.shift,
      search: filters.search,
    });

    try {
      const response = await fetch(`/api/employee/attendance-history?${params}`, {
        cache: "no-store",
        signal,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Gagal mengambil riwayat absensi.");
      }

      const nextTotal = payload.total || 0;
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      if (page > nextTotalPages) {
        setPage(nextTotalPages);
      }

      setRows(mergeLocalAttendancePhotos(payload.rows || []));
      setTotal(nextTotal);
      setYears(payload.years || [new Date().getFullYear()]);
      setSummary(
        payload.summary || {
          hadir: 0,
          terlambat: 0,
          izin: 0,
          tidakHadir: 0,
        },
      );
      setEmployee(payload.employee || { name: "Karyawan" });
      return true;
    } catch (error) {
      if (error.name === "AbortError") return false;
      setRows([]);
      setTotal(0);
      setErrorMessage(error.message);
      return false;
    }
  }, [filters, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => ({ ...current, search: searchInput.trim() }));
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRows() {
      setIsLoading(true);
      setErrorMessage("");
      await fetchRows({ signal: controller.signal });
      if (!controller.signal.aborted) setIsLoading(false);
    }

    loadRows();
    return () => controller.abort();
  }, [fetchRows]);

  async function handleRefresh() {
    setIsRefreshing(true);
    setErrorMessage("");
    const ok = await fetchRows();
    setIsRefreshing(false);
    setToast({
      type: ok ? "success" : "error",
      message: ok ? "Data berhasil diperbarui" : "Gagal memperbarui data",
    });
  }

  const summaryCards = useMemo(
    () => [
      ["Total Hadir", summary.hadir, CheckCircle2, "#2DD4BF"],
      ["Terlambat", summary.terlambat, AlertTriangle, "#FACC15"],
      ["Izin/Sakit", summary.izin, Stethoscope, "#60A5FA"],
      ["Tidak Hadir", summary.tidakHadir, ShieldCheck, "#FB7185"],
    ],
    [summary],
  );

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
    setPage(1);
  }

  async function handleExportPdf() {
    const params = new URLSearchParams({
      page: "1",
      pageSize: "100",
      month: filters.month,
      year: filters.year,
      status: filters.status,
      shift: filters.shift,
      search: filters.search,
      export: "1",
    });
    const response = await fetch(`/api/employee/attendance-history?${params}`, {
      cache: "no-store",
    });
    const payload = await response.json();
    const exportRows = payload.rows || [];
    const rowsHtml = exportRows
      .map(
        (row) => `
          <tr>
            <td>${formatLongDate(row.dateValue)}</td>
            <td>${row.location}</td>
            <td>${row.clockIn}</td>
            <td>${row.clockOut}</td>
            <td>${row.status}</td>
            <td>${row.shift}</td>
          </tr>
        `,
      )
      .join("");
    const reportWindow = window.open("", "_blank", "width=980,height=720");

    if (!reportWindow) return;

    reportWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Riwayat Absensi</title>
          <style>
            body { font-family: Arial, sans-serif; color: #172033; padding: 28px; }
            h1 { margin: 0 0 6px; font-size: 22px; }
            p { margin: 0 0 8px; color: #526070; }
            .meta { margin-bottom: 20px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #d8dee8; padding: 10px; text-align: left; }
            th { background: #eef3fb; }
          </style>
        </head>
        <body>
          <h1>Riwayat Absensi Karyawan</h1>
          <div class="meta">
            <p>Nama Karyawan: ${payload.employee?.name || employee.name}</p>
            <p>Periode: ${periodLabel}</p>
            <p>Total Data: ${payload.total || exportRows.length}</p>
            <p>Tanggal Export: ${formatExportDate()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Lokasi/Kantor</th>
                <th>Jam Masuk</th>
                <th>Jam Pulang</th>
                <th>Status</th>
                <th>Shift</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="6">Tidak ada riwayat absensi yang sesuai dengan filter yang dipilih.</td></tr>`}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  }

  return (
    <EmployeeShell>
      {toast ? (
        <div
          className={[
            "fixed right-4 top-24 z-50 rounded-2xl border px-4 py-3 text-sm font-bold shadow-2xl backdrop-blur-xl",
            toast.type === "success"
              ? "border-[#34D399]/35 bg-[#1F3A31]/95 text-[#D1FAE5]"
              : "border-[#F87171]/35 bg-[#3A1F24]/95 text-[#FECACA]",
          ].join(" ")}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="mx-auto max-w-[1440px] space-y-5 pb-20">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-[#A7B3C6]">Attendance history</p>
            <h2 className="mt-1 text-2xl font-bold text-[#F8FAFC] sm:text-3xl">
              Data Kehadiran
            </h2>
            <p className="mt-1 text-sm text-[#A7B3C6]">
              Review riwayat absensi pribadi dan bukti foto kehadiran.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#64748B] bg-[linear-gradient(135deg,#1E293B,#334155)] px-5 text-sm font-bold text-[#F8FAFC] shadow-[0_10px_24px_rgba(0,0,0,.18)] transition hover:bg-[#475569]"
          >
            <Download size={17} />
            Export PDF
          </button>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(([label, value, Icon, color]) => (
            <SummaryCard
              key={label}
              label={label}
              value={value}
              Icon={Icon}
              color={color}
            />
          ))}
        </div>

        <section className="rounded-2xl border border-[#2D4568] bg-[#111C2E] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.28)] sm:p-5">
          <div className="rounded-[18px] border border-[rgba(96,165,250,0.22)] bg-[linear-gradient(145deg,#142136,#111C2E)] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.24)]">
            <div className="grid gap-3 xl:grid-cols-[150px_120px_150px_140px_minmax(240px,1fr)_auto] xl:items-end">
            <SelectFilter
              label="Bulan"
              value={filters.month}
              onChange={(value) => updateFilter("month", value)}
            >
              {months.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectFilter>
            <SelectFilter
              label="Tahun"
              value={filters.year}
              onChange={(value) => updateFilter("year", value)}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </SelectFilter>
            <SelectFilter
              label="Status"
              value={filters.status}
              onChange={(value) => updateFilter("status", value)}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectFilter>
            <SelectFilter
              label="Shift"
              value={filters.shift}
              onChange={(value) => updateFilter("shift", value)}
            >
              {shiftOptions.map((shift) => (
                <option key={shift} value={shift}>
                  {shift}
                </option>
              ))}
            </SelectFilter>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#CBD5E1]">
                Search
              </span>
              <span className="flex h-11 items-center gap-3 rounded-xl border border-[#2D4568] bg-[#0D1728] px-4 text-sm text-[#94A3B8] transition focus-within:border-[#38BDF8] focus-within:shadow-[0_0_0_3px_rgba(56,189,248,0.12)] hover:border-[#38BDF8]">
                <Search size={18} className="text-[#38BDF8]" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Cari tanggal, lokasi, atau shift"
                  className="min-w-0 flex-1 bg-transparent text-[#F8FAFC] outline-none placeholder:text-[#94A3B8]"
                />
              </span>
            </label>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#60A5FA] bg-[linear-gradient(135deg,#2563EB,#1D4ED8)] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(37,99,235,0.25)] transition hover:bg-[linear-gradient(135deg,#1D4ED8,#2563EB)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={17} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? "Memuat..." : "Refresh"}
            </button>
            </div>
          </div>

          <div className="mt-5 max-h-[560px] overflow-auto rounded-2xl border border-[rgba(96,165,250,0.22)] bg-[#111C2E]">
            <table className="w-full min-w-[760px] text-left">
              <thead className="sticky top-0 z-10 border-b border-[#2D4568] bg-[#1C2B43] text-xs uppercase tracking-wider text-[#CBD5E1] shadow-[0_1px_0_#2D4568]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Jam Masuk</th>
                  <th className="px-4 py-3 font-semibold">Jam Pulang</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Shift</th>
                  <th className="px-4 py-3 font-semibold">Foto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D4568]/70 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-[#A7B3C6]">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <Loader2 size={17} className="animate-spin" />
                        Memuat riwayat absensi...
                      </span>
                    </td>
                  </tr>
                ) : null}
                {!isLoading &&
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors duration-200 ease-in-out odd:bg-[#142136] even:bg-[#172840] hover:bg-[#223754]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 flex-col">
                          <span className="font-bold text-[#F8FAFC]">
                            {formatLongDate(row.dateValue)}
                          </span>
                          <span
                            className="max-w-[240px] truncate text-xs text-[#B8C0CC]"
                            title={row.location}
                          >
                            {row.location}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#F8FAFC]">
                        {row.clockIn === "--:--:--" ? <MissingClock /> : row.clockIn}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#F8FAFC]">
                        {row.clockOut === "--:--:--" ? <MissingClock /> : row.clockOut}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusClasses[row.status] || statusClasses.Hadir}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#F8FAFC]">{row.shift}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setActivePhoto(row)}
                          disabled={!row.photo && !row.outPhoto}
                          title={row.photo || row.outPhoto ? "Lihat foto absensi" : "Foto tidak tersedia"}
                          className="inline-flex min-h-9 items-center gap-2 rounded-[10px] border border-[#60A5FA] bg-[#1D4ED8] px-3 text-xs font-bold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:border-[#475569] disabled:bg-[#1E293B] disabled:text-[#94A3B8]"
                        >
                          {row.photo || row.outPhoto ? <Eye size={15} /> : <ImageIcon size={15} />}
                          {row.photo || row.outPhoto ? "Foto" : "Tidak Ada"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {!isLoading && !rows.length ? (
              <div className="mt-4 rounded-2xl border border-[#2D4568] bg-[#142136] p-8 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-[#2D4568] bg-[#17243A] text-[#38BDF8]">
                  <FileQuestion size={28} />
                </div>
                <p className="mt-4 font-bold text-[#F8FAFC]">
                  Tidak ada riwayat absensi yang sesuai dengan filter yang dipilih.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-[#60A5FA] bg-[linear-gradient(135deg,#2563EB,#1D4ED8)] px-5 text-sm font-bold text-white transition hover:bg-[linear-gradient(135deg,#1D4ED8,#2563EB)]"
                >
                  Reset Filter
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-[#2D4568] pt-4 text-sm text-[#CBD5E1] md:flex-row md:items-center md:justify-between">
            <p>
              Menampilkan {startItem}
              {"\u2013"}
              {endItem} dari {total} data
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || isLoading}
                className="min-h-10 rounded-xl border border-[#2D4568] bg-[#142136] px-4 font-bold text-[#F8FAFC] transition hover:bg-[#223754] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Sebelumnya
              </button>
              <span className="grid min-h-10 min-w-10 place-items-center rounded-xl border border-[#60A5FA] bg-[#2563EB] px-3 font-bold text-white">
                {page}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={page >= totalPages || isLoading}
                className="min-h-10 rounded-xl border border-[#2D4568] bg-[#142136] px-4 font-bold text-[#F8FAFC] transition hover:bg-[#223754] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </section>
      </div>

      {activePhoto ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#2D4568] bg-[#111C2E] shadow-[0_24px_70px_rgba(0,0,0,.45)]">
            <div className="flex items-center justify-between border-b border-[#2D4568] px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">
                  {formatLongDate(activePhoto.dateValue)}
                </h3>
                <p className="text-sm text-[#A7B3C6]">{activePhoto.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="grid size-9 place-items-center rounded-lg border border-[#2D4568] text-[#CBD5E1] transition hover:bg-[#223754] hover:text-[#F8FAFC]"
                aria-label="Tutup preview foto"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {[
                [
                  "Foto Masuk",
                  activePhoto.photo,
                  activePhoto.photo ? "" : "Foto masuk tidak tersedia",
                ],
                [
                  "Foto Keluar",
                  activePhoto.outPhoto,
                  activePhoto.hasCheckedOut
                    ? "Foto keluar gagal tersimpan atau tidak tersedia di storage"
                    : "Foto keluar belum tersedia",
                ],
              ].map(([label, photo, emptyMessage]) => (
                <div
                  key={label}
                  className="overflow-hidden rounded-2xl border border-[#2D4568] bg-[#142136]"
                >
                  <div className="border-b border-[#2D4568] px-4 py-3 text-sm font-bold text-[#F8FAFC]">
                    {label}
                  </div>
                  <PhotoPreview src={photo} alt={label} emptyMessage={emptyMessage} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </EmployeeShell>
  );
}
