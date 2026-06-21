"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileQuestion,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { readEmployeeLeaveRequests } from "@/lib/browser/employee-leave-store";

const PAGE_SIZE = 10;
const statusOptions = ["Semua", "Menunggu", "Disetujui", "Ditolak"];
const typeOptions = ["Semua", "Cuti", "Izin", "Sakit", "Dispensasi"];

const emptyFilters = {
  search: "",
  status: "Semua",
  type: "Semua",
  startDate: "",
  endDate: "",
};

const statusStyles = {
  Menunggu:
    "border-[#f59e0b] bg-[rgba(245,158,11,0.15)] text-[#fbbf24]",
  Disetujui:
    "border-[#22c55e] bg-[rgba(34,197,94,0.15)] text-[#4ade80]",
  Ditolak:
    "border-[#ef4444] bg-[rgba(239,68,68,0.15)] text-[#f87171]",
};

const statusIcons = {
  Menunggu: Clock3,
  Disetujui: CheckCircle2,
  Ditolak: XCircle,
};

const statusAccents = {
  Menunggu: "#F59E0B",
  Disetujui: "#22C55E",
  Ditolak: "#EF4444",
};

function formatDate(value, variant = "long") {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: variant === "short" ? "short" : "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function getValidDate(value) {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00+07:00`)
    : new Date(value);

  if (!Number.isFinite(date.getTime()) || date.getFullYear() < 2000) {
    return null;
  }

  return date;
}

function getJakartaDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getSubmittedDateValue(request) {
  if (getValidDate(request.createdAt)) return request.createdAt;

  const today = getJakartaDateString();
  if (request.startDate && request.startDate >= today) return today;
  return request.startDate || today;
}

function formatSubmittedDate(request) {
  const date = getValidDate(getSubmittedDateValue(request));
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function durationDays(startDate, endDate) {
  if (!startDate || !endDate) return "-";
  const start = new Date(`${startDate}T00:00:00+07:00`);
  const end = new Date(`${endDate}T00:00:00+07:00`);
  const days = Math.round((end - start) / 86400000) + 1;
  return `${Math.max(1, days)} Hari`;
}

function dateRangeLabel(startDate, endDate) {
  if (!startDate && !endDate) return "-";
  return startDate === endDate
    ? formatDate(startDate, "short")
    : `${formatDate(startDate, "short")} - ${formatDate(endDate, "short")}`;
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

function DateFilter({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#CBD5E1]">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[#2D4568] bg-[#0D1728] px-3 text-sm font-semibold text-[#F8FAFC] outline-none transition hover:border-[#38BDF8] focus:border-[#38BDF8] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.12)]"
      />
    </label>
  );
}

function SummaryCard({ label, value, Icon, color }) {
  return (
    <div
      className="group relative min-h-[104px] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,#1C2B43_0%,#132036_58%,#0C1627_100%)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.34),0_0_0_1px_rgba(56,189,248,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(56,189,248,0.45)]"
      style={{ boxShadow: `0 18px 40px rgba(0,0,0,.34), 0 0 28px ${color}12` }}
    >
      <div className="absolute inset-x-0 top-0 h-px opacity-80" style={{ background: color }} />
      <div className="absolute bottom-0 left-0 top-0 w-1 rounded-r-full" style={{ background: color }} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#C7D2FE]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-extrabold" style={{ color }}>
            {value}
          </p>
        </div>
        <div
          className="grid size-11 place-items-center rounded-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          style={{ background: `${color}24` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const Icon = statusIcons[status] || Clock3;
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase",
        statusStyles[status] || statusStyles.Menunggu,
      ].join(" ")}
    >
      <Icon size={13} />
      {status}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid min-h-[46px] gap-1 rounded-xl border border-[#2D4568]/70 bg-[#0D1728] px-3 py-2.5 sm:grid-cols-[132px_1fr] sm:items-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
        {label}
      </p>
      <div className="text-sm font-semibold text-[#F8FAFC]">{value}</div>
    </div>
  );
}

function requestCardStyle(status) {
  const color = statusAccents[status] || "#38BDF8";
  return {
    borderColor: `${color}55`,
    boxShadow: `0 18px 38px rgba(0,0,0,.28), 0 0 28px ${color}12`,
    "--request-accent": color,
  };
}

function mergeLocalSubmissionDates(requests) {
  const localRequests = readEmployeeLeaveRequests();
  const createdAtById = new Map(
    localRequests
      .filter((request) => request.id && getValidDate(request.createdAt))
      .map((request) => [request.id, request.createdAt]),
  );

  return requests.map((request) => ({
    ...request,
    createdAt: getValidDate(request.createdAt)
      ? request.createdAt
      : createdAtById.get(request.id) || null,
  }));
}

function getSubmissionTime(request) {
  const date = getValidDate(getSubmittedDateValue(request));
  return date ? date.getTime() : 0;
}

function sortBySubmissionDate(requests) {
  return [...requests].sort((first, second) => {
    const timeDiff = getSubmissionTime(second) - getSubmissionTime(first);
    if (timeDiff !== 0) return timeDiff;
    return String(second.id || "").localeCompare(String(first.id || ""));
  });
}

export default function EmployeeLeaveHistoryPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [filters, setFilters] = useState(emptyFilters);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startItem = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endItem = Math.min(page * PAGE_SIZE, total);

  const summaryCards = useMemo(
    () => [
      ["Total Pengajuan", summary.total, FileText, "#38BDF8"],
      ["Disetujui", summary.approved, ShieldCheck, "#22C55E"],
      ["Menunggu", summary.pending, Clock3, "#F59E0B"],
      ["Ditolak", summary.rejected, XCircle, "#EF4444"],
    ],
    [summary],
  );

  const pageNumbers = useMemo(() => {
    const first = Math.max(1, page - 2);
    const last = Math.min(totalPages, first + 4);
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  }, [page, totalPages]);

  const fetchRows = useCallback(async ({ signal } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      status: filters.status,
      type: filters.type,
      startDate: filters.startDate,
      endDate: filters.endDate,
      search: filters.search,
    });

    try {
      const response = await fetch(`/api/employee/leave-requests?${params}`, {
        cache: "no-store",
        signal,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Gagal mengambil riwayat pengajuan izin.");
      }

      const nextTotal = payload.total || 0;
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      if (page > nextTotalPages) {
        setPage(nextTotalPages);
      }

      setRows(sortBySubmissionDate(mergeLocalSubmissionDates(payload.requests || [])));
      setTotal(nextTotal);
      setSummary(
        payload.summary || {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        },
      );
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

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(emptyFilters);
    setSearchInput("");
    setPage(1);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    setErrorMessage("");
    const ok = await fetchRows();
    setIsRefreshing(false);
    setToast({
      type: ok ? "success" : "error",
      message: ok ? "Data pengajuan diperbarui" : "Gagal memperbarui data",
    });
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
            <p className="text-sm font-semibold text-[#A7B3C6]">Leave request history</p>
            <h2 className="mt-1 text-2xl font-bold text-[#F8FAFC] sm:text-3xl">
              Riwayat Pengajuan Izin
            </h2>
            <p className="mt-1 text-sm text-[#A7B3C6]">
              Lihat seluruh riwayat pengajuan cuti, izin, sakit, dan dispensasi yang pernah diajukan.
            </p>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#38BDF8]/40 bg-[#0D1728] px-4 text-sm font-bold text-[#DDF7FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_22px_rgba(0,0,0,0.20)] transition hover:border-[#38BDF8] hover:bg-[#142136] hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={17} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? "Memuat" : "Perbarui"}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(([label, value, Icon, color]) => (
            <SummaryCard
              key={label}
              label={label}
              value={isLoading ? "..." : value}
              Icon={Icon}
              color={color}
            />
          ))}
          </div>
        </div>

        <section className="relative overflow-hidden rounded-2xl border border-[#3B82F6]/30 bg-[linear-gradient(145deg,#15233A_0%,#101D31_54%,#0B1424_100%)] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.36),0_0_0_1px_rgba(56,189,248,0.07)] sm:p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#38BDF8,#22C55E,#F59E0B,#EF4444)]" />
          <div className="absolute right-6 top-8 h-28 w-28 rounded-full bg-[#38BDF8]/10 blur-2xl" />
          <div className="relative rounded-[18px] border border-[rgba(96,165,250,0.30)] bg-[linear-gradient(145deg,#1A2A42,#101D31)] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_150px_170px_150px_150px] xl:items-end">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#CBD5E1]">
                  Search Pengajuan
                </span>
                <span className="flex h-11 items-center gap-3 rounded-xl border border-[#2D4568] bg-[#0D1728] px-4 text-sm text-[#94A3B8] transition focus-within:border-[#38BDF8] focus-within:shadow-[0_0_0_3px_rgba(56,189,248,0.12)] hover:border-[#38BDF8]">
                  <Search size={18} className="text-[#38BDF8]" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Cari alasan, jenis, atau lampiran"
                    className="min-w-0 flex-1 bg-transparent text-[#F8FAFC] outline-none placeholder:text-[#94A3B8]"
                  />
                </span>
              </label>

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
                label="Jenis Pengajuan"
                value={filters.type}
                onChange={(value) => updateFilter("type", value)}
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </SelectFilter>

              <DateFilter
                label="Dari Tanggal"
                value={filters.startDate}
                onChange={(value) => updateFilter("startDate", value)}
              />
              <DateFilter
                label="Sampai"
                value={filters.endDate}
                onChange={(value) => updateFilter("endDate", value)}
              />

            </div>
          </div>

          <div className="relative mt-5 grid gap-3">
            {isLoading ? (
              <div className="grid min-h-52 place-items-center rounded-2xl border border-[#2D4568] bg-[#142136] text-sm font-semibold text-[#A7B3C6]">
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={17} className="animate-spin" />
                  Memuat riwayat pengajuan izin...
                </span>
              </div>
            ) : null}

            {!isLoading &&
              rows.map((request) => (
                <article
                  key={request.id}
                  className="group relative overflow-hidden rounded-2xl border bg-[linear-gradient(145deg,#1A2A42_0%,#122139_58%,#0C1627_100%)] p-4 transition duration-200 hover:-translate-y-0.5"
                  style={requestCardStyle(request.status)}
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-[var(--request-accent)]" />
                  <div className="absolute inset-x-0 top-0 h-px bg-[var(--request-accent)] opacity-70" />
                  <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-[var(--request-accent)] opacity-10 blur-2xl transition group-hover:opacity-20" />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="relative min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#F8FAFC]">
                          {request.type}
                        </p>
                        <StatusBadge status={request.status} />
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#A7B3C6]">
                        <CalendarRange size={16} className="text-[#38BDF8]" />
                        {dateRangeLabel(request.startDate, request.endDate)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveRequest(request)}
                      className="relative inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-[#60A5FA]/55 bg-[#13243B] px-3 text-xs font-bold text-[#E0F2FE] shadow-[0_10px_22px_rgba(0,0,0,0.18)] transition hover:border-[#38BDF8] hover:bg-[#1D4ED8] hover:text-white"
                    >
                      <Eye size={15} />
                      Detail
                    </button>
                  </div>

                  <p className="relative mt-3 line-clamp-2 text-sm leading-6 text-[#CBD5E1]">
                    {request.reason}
                  </p>
                  <div className="relative mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#94A3B8]">
                    <span>Lampiran: {request.attachmentName || "Tidak ada"}</span>
                    <span className="hidden text-[#2D4568] sm:inline">|</span>
                    <span>Diajukan: {formatSubmittedDate(request)}</span>
                  </div>
                </article>
              ))}

            {!isLoading && !rows.length ? (
              <div className="rounded-2xl border border-[#2D4568] bg-[#142136] p-8 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-[#2D4568] bg-[#17243A] text-[#38BDF8]">
                  <FileQuestion size={28} />
                </div>
                <p className="mt-4 font-bold text-[#F8FAFC]">
                  Tidak ada pengajuan yang sesuai dengan filter.
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
              Menampilkan {startItem}-{endItem} dari {total} data
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || isLoading}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#2D4568] bg-[#142136] px-4 font-bold text-[#F8FAFC] transition hover:bg-[#223754] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              {pageNumbers.map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => setPage(number)}
                  disabled={isLoading}
                  className={[
                    "grid min-h-10 min-w-10 place-items-center rounded-xl border px-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
                    page === number
                      ? "border-[#60A5FA] bg-[#2563EB] text-white"
                      : "border-[#2D4568] bg-[#142136] text-[#F8FAFC] hover:bg-[#223754]",
                  ].join(" ")}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={page >= totalPages || isLoading}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#2D4568] bg-[#142136] px-4 font-bold text-[#F8FAFC] transition hover:bg-[#223754] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {activeRequest ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[#2D4568] bg-[#111C2E] shadow-[0_24px_70px_rgba(0,0,0,.45)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#2D4568] px-5 py-3.5">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">Detail Pengajuan</h3>
                <p className="mt-0.5 text-sm text-[#A7B3C6]">
                  Informasi lengkap pengajuan izin karyawan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveRequest(null)}
                className="grid size-9 place-items-center rounded-lg border border-[#2D4568] text-[#CBD5E1] transition hover:bg-[#223754] hover:text-[#F8FAFC]"
                aria-label="Tutup detail pengajuan"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <DetailRow label="Jenis" value={activeRequest.type} />
                <DetailRow label="Status" value={<StatusBadge status={activeRequest.status} />} />
                <DetailRow label="Tanggal Mulai" value={formatDate(activeRequest.startDate)} />
                <DetailRow label="Tanggal Selesai" value={formatDate(activeRequest.endDate)} />
                <DetailRow
                  label="Durasi"
                  value={durationDays(activeRequest.startDate, activeRequest.endDate)}
                />
                <DetailRow label="Tanggal Pengajuan" value={formatDateTime(activeRequest.createdAt)} />
                <DetailRow
                  label="Tanggal Persetujuan"
                  value={activeRequest.status === "Menunggu" ? "-" : formatDateTime(activeRequest.updatedAt)}
                />
                <DetailRow label="Nama File" value={activeRequest.attachmentName || "-"} />
              </div>

              <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[1.45fr_1fr]">
                <div className="rounded-xl border border-[#2D4568]/70 bg-[#0D1728] px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                    Alasan Lengkap
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-[#F8FAFC]">{activeRequest.reason}</p>
                </div>

                <div className="rounded-xl border border-[#2D4568]/70 bg-[#0D1728] px-3 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                    Catatan Admin
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-[#F8FAFC]">
                    {activeRequest.adminNote || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2D4568] bg-[#142136] px-3 py-2.5">
                <div>
                  <p className="text-sm font-bold text-[#F8FAFC]">Lampiran</p>
                  <p className="mt-0.5 text-xs text-[#A7B3C6]">
                    {activeRequest.attachmentName || "Tidak ada lampiran"}
                  </p>
                </div>
                {activeRequest.attachmentUrl ? (
                  <a
                    href={activeRequest.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#60A5FA] bg-[#1D4ED8] px-4 text-sm font-bold text-white transition hover:bg-[#2563EB]"
                  >
                    <Download size={16} />
                    Download Lampiran
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#475569] bg-[#1E293B] px-4 text-sm font-bold text-[#94A3B8]"
                  >
                    <Download size={16} />
                    Lampiran Tidak Tersedia
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </EmployeeShell>
  );
}
