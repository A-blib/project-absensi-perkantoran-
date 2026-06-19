"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  FileUp,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Timer,
  XCircle,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { createEmployeeNotification } from "@/lib/browser/employee-notification-store";

const requestTypes = ["Izin", "Sakit", "Cuti", "Keperluan pribadi"];
const statusFilters = ["Semua", "Menunggu", "Disetujui", "Ditolak"];
const maxFileSize = 2 * 1024 * 1024;
const allowedFileTypes = ["application/pdf", "image/jpeg", "image/png"];

const emptyForm = {
  type: "",
  startDate: "",
  endDate: "",
  reason: "",
  attachment: null,
};

const statusStyles = {
  Menunggu: {
    icon: Timer,
    badge: "border-[#FACC15]/45 bg-[#FACC15]/12 text-[#FACC15]",
  },
  Disetujui: {
    icon: CheckCircle2,
    badge: "border-[#22C55E]/45 bg-[#22C55E]/12 text-[#4ADE80]",
  },
  Ditolak: {
    icon: XCircle,
    badge: "border-[#EF4444]/45 bg-[#EF4444]/12 text-[#F87171]",
  },
};

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatCreatedAt(value) {
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

function dateRangeLabel(startDate, endDate) {
  if (!startDate && !endDate) return "-";
  return startDate === endDate
    ? formatDate(startDate)
    : `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function buildSummary(rows) {
  return rows.reduce(
    (summary, request) => {
      summary.total += 1;
      if (request.status === "Disetujui") summary.approved += 1;
      if (request.status === "Menunggu") summary.pending += 1;
      return summary;
    },
    { total: 0, approved: 0, pending: 0 },
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-2 text-xs font-semibold text-[#FCA5A5]">{message}</p>;
}

function SummaryMiniCard({ label, value, Icon, color, className }) {
  return (
    <div
      className={[
        "rounded-2xl border p-4 shadow-[0_10px_24px_rgba(0,0,0,.16)]",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#CBD5E1]">
          {label}
        </p>
        <div className="grid size-9 place-items-center rounded-xl" style={{ background: `${color}1F` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-extrabold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

export default function EmployeeLeavePage() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [loadError, setLoadError] = useState("");

  const filteredRequests = useMemo(() => {
    if (statusFilter === "Semua") return requests;
    return requests.filter((request) => request.status === statusFilter);
  }, [requests, statusFilter]);

  const loadRequests = useCallback(async ({ signal, silent = false } = {}) => {
    if (!silent) setLoadError("");
    const response = await fetch("/api/employee/leave-requests", {
      cache: "no-store",
      signal,
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Gagal mengambil data pengajuan.");
    }

    console.log("query result:", payload.requests || []);

    setRequests(payload.requests || []);
    setSummary(buildSummary(payload.requests || []));
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function initialLoad() {
      try {
        setIsLoading(true);
        await loadRequests({ signal: controller.signal });
      } catch (error) {
        if (error.name !== "AbortError") setLoadError(error.message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    initialLoad();
    return () => controller.abort();
  }, [loadRequests]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.type) nextErrors.type = "Jenis pengajuan wajib dipilih.";
    if (!form.startDate) nextErrors.startDate = "Tanggal mulai wajib diisi.";
    if (!form.endDate) nextErrors.endDate = "Tanggal selesai wajib diisi.";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      nextErrors.endDate = "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.";
    }
    if (form.reason.trim().length < 10) {
      nextErrors.reason = "Alasan wajib diisi minimal 10 karakter.";
    }
    if (form.attachment) {
      if (!allowedFileTypes.includes(form.attachment.type)) {
        nextErrors.attachment = "Lampiran hanya boleh PDF, JPG, atau PNG.";
      } else if (form.attachment.size > maxFileSize) {
        nextErrors.attachment = "Ukuran lampiran maksimal 2 MB.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    updateForm("attachment", file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setLoadError("");

    try {
      const body = new FormData();
      body.append("type", form.type);
      body.append("startDate", form.startDate);
      body.append("endDate", form.endDate);
      body.append("reason", form.reason.trim());
      if (form.attachment) body.append("attachment", form.attachment);

      const response = await fetch("/api/employee/leave-requests", {
        method: "POST",
        body,
      });
      const payload = await response.json();

      if (!response.ok) {
        if (payload.errors) setErrors(payload.errors);
        throw new Error(payload.message || "Gagal mengirim pengajuan.");
      }

      setRequests((current) => [payload.request, ...current]);
      setSummary((current) => ({
        total: (current?.total || 0) + 1,
        approved: current?.approved || 0,
        pending: (current?.pending || 0) + 1,
      }));
      setForm(emptyForm);
      setErrors({});
      setStatusFilter("Semua");
      setNotice({
        type: "success",
        message: "Pengajuan berhasil dikirim dan menunggu persetujuan.",
      });
      createEmployeeNotification({
        title: "Pengajuan izin dikirim",
        message: `${payload.request.type} tanggal ${dateRangeLabel(
          payload.request.startDate,
          payload.request.endDate,
        )} menunggu persetujuan admin.`,
        category: "izin",
        type: "info",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    setLoadError("");
    try {
      await loadRequests({ silent: true });
      setNotice({ type: "success", message: "Data pengajuan diperbarui." });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
      setLoadError(error.message);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <EmployeeShell>
      {notice ? (
        <div
          className={[
            "fixed right-4 top-24 z-50 flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl",
            notice.type === "success"
              ? "border-[#22C55E]/35 bg-[#10251D]/95 text-[#BBF7D0]"
              : "border-[#EF4444]/35 bg-[#2B1519]/95 text-[#FECACA]",
          ].join(" ")}
        >
          {notice.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {notice.message}
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-[#334155] bg-[#1E293B] p-6 shadow-[0_18px_45px_rgba(0,0,0,.24)] sm:p-8"
          noValidate
        >
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#22D3EE]">Leave request</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#E5E7EB] sm:text-3xl">
                Form Pengajuan Izin
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]">
                Lengkapi detail pengajuan agar admin bisa memproses izin dengan cepat.
              </p>
            </div>
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#22D3EE]/25 bg-[#22D3EE]/10 text-[#22D3EE]">
              <FileText size={24} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-[#E5E7EB]">Jenis Pengajuan</span>
              <select
                value={form.type}
                onChange={(event) => updateForm("type", event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-[#475569] bg-[#0F172A] px-4 text-sm font-semibold text-[#E5E7EB] outline-none transition hover:border-[#22D3EE]/70 focus:border-[#22D3EE] focus:shadow-[0_0_0_3px_rgba(34,211,238,.12)]"
              >
                <option value="">Pilih jenis pengajuan</option>
                {requestTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <FieldError message={errors.type} />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#E5E7EB]">Lampiran Dokumen</span>
              <span className="mt-2 flex h-12 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[#22D3EE]/45 bg-[#0F172A] px-4 text-sm font-semibold text-[#E5E7EB] transition hover:border-[#22D3EE] hover:bg-[#111D31]">
                <FileUp size={18} className="text-[#22D3EE]" />
                <span className="min-w-0 flex-1 truncate">
                  {form.attachment?.name || "PDF, JPG, PNG maksimal 2 MB"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </span>
              <FieldError message={errors.attachment} />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#E5E7EB]">Tanggal Mulai</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => {
                  updateForm("startDate", event.target.value);
                  if (!form.endDate) updateForm("endDate", event.target.value);
                }}
                className="mt-2 h-12 w-full rounded-2xl border border-[#475569] bg-[#0F172A] px-4 text-sm font-semibold text-[#E5E7EB] outline-none transition hover:border-[#22D3EE]/70 focus:border-[#22D3EE] focus:shadow-[0_0_0_3px_rgba(34,211,238,.12)]"
              />
              <FieldError message={errors.startDate} />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#E5E7EB]">Tanggal Selesai</span>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(event) => updateForm("endDate", event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-[#475569] bg-[#0F172A] px-4 text-sm font-semibold text-[#E5E7EB] outline-none transition hover:border-[#22D3EE]/70 focus:border-[#22D3EE] focus:shadow-[0_0_0_3px_rgba(34,211,238,.12)]"
              />
              <FieldError message={errors.endDate} />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-bold text-[#E5E7EB]">Alasan Pengajuan</span>
            <textarea
              value={form.reason}
              onChange={(event) => updateForm("reason", event.target.value.slice(0, 240))}
              rows={6}
              className="mt-2 min-h-[160px] w-full resize-none rounded-2xl border border-[#475569] bg-[#0F172A] px-4 py-3 text-sm leading-6 text-[#E5E7EB] outline-none transition placeholder:text-[#94A3B8] hover:border-[#22D3EE]/70 focus:border-[#22D3EE] focus:shadow-[0_0_0_3px_rgba(34,211,238,.12)]"
              placeholder="Tuliskan alasan pengajuan minimal 10 karakter"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <FieldError message={errors.reason} />
              <span className="ml-auto text-xs font-semibold text-[#94A3B8]">
                {form.reason.length}/240 karakter
              </span>
            </div>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#2563EB,#22D3EE)] px-6 font-bold text-white shadow-[0_14px_28px_rgba(37,99,235,.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(34,211,238,.2)] disabled:pointer-events-none disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
          </button>
        </form>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-[#334155] bg-[#1E293B] p-6 shadow-[0_18px_45px_rgba(0,0,0,.22)]">
            <div>
              <p className="text-sm font-semibold text-[#22D3EE]">Overview</p>
              <h3 className="mt-1 text-xl font-extrabold text-[#E5E7EB]">
                Ringkasan Pengajuan
              </h3>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <SummaryMiniCard
                label="Total"
                value={isLoading && !summary ? "..." : summary?.total || 0}
                Icon={FileText}
                color="#22D3EE"
                className="border-[#22D3EE]/25 bg-[#0F1E2B]"
              />
              <SummaryMiniCard
                label="Disetujui"
                value={isLoading && !summary ? "..." : summary?.approved || 0}
                Icon={ShieldCheck}
                color="#22C55E"
                className="border-[#22C55E]/25 bg-[#10231D]"
              />
              <SummaryMiniCard
                label="Menunggu"
                value={isLoading && !summary ? "..." : summary?.pending || 0}
                Icon={Clock3}
                color="#FACC15"
                className="border-[#FACC15]/25 bg-[#292414]"
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-[#334155] bg-[#1E293B] p-6 shadow-[0_18px_45px_rgba(0,0,0,.22)]">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#22D3EE]">Request status</p>
                <h3 className="mt-1 text-xl font-extrabold text-[#E5E7EB]">
                  Status Pengajuan
                </h3>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#22D3EE]/35 bg-[#0F172A] px-3 text-sm font-bold text-[#E5E7EB] transition hover:border-[#22D3EE] hover:bg-[#111D31] disabled:pointer-events-none disabled:opacity-60"
              >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Memuat..." : "Refresh"}
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {statusFilters.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                    statusFilter === status
                      ? "border-[#22D3EE] bg-[#22D3EE]/12 text-[#A5F3FC]"
                      : "border-[#334155] bg-[#0F172A] text-[#94A3B8] hover:border-[#22D3EE]/70 hover:text-[#E5E7EB]",
                  ].join(" ")}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="grid min-h-64 place-items-center rounded-2xl border border-[#334155] bg-[#0F172A] text-sm font-semibold text-[#94A3B8]">
                  <Loader2 size={22} className="mb-2 animate-spin text-[#22D3EE]" />
                  Memuat status pengajuan...
                </div>
              ) : loadError ? (
                <div className="grid min-h-64 place-items-center rounded-2xl border border-[#FACC15]/30 bg-[#292414] p-6 text-center text-sm font-semibold text-[#FDE68A]">
                  <div>
                    <AlertTriangle className="mx-auto mb-3 text-[#FACC15]" size={26} />
                    {loadError}
                  </div>
                </div>
              ) : filteredRequests.length ? (
                filteredRequests.map((request) => {
                  const StatusIcon = statusStyles[request.status]?.icon || Timer;
                  return (
                    <article
                      key={request.id}
                      className="rounded-2xl border border-[#334155] bg-[#0F172A] p-4 shadow-[0_10px_24px_rgba(0,0,0,.14)] transition hover:-translate-y-0.5 hover:border-[#22D3EE]/45 hover:bg-[#111D31]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-extrabold text-[#E5E7EB]">{request.type}</p>
                          <p className="mt-1 text-sm font-semibold text-[#94A3B8]">
                            {dateRangeLabel(request.startDate, request.endDate)}
                          </p>
                        </div>
                        <span
                          className={[
                            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
                            statusStyles[request.status]?.badge || statusStyles.Menunggu.badge,
                          ].join(" ")}
                        >
                          <StatusIcon size={14} />
                          {request.status}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#CBD5E1]">
                        {request.reason}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#94A3B8]">
                        <span>Dibuat {formatCreatedAt(request.createdAt)}</span>
                        {request.attachmentName ? (
                          <span className="rounded-full border border-[#22D3EE]/25 bg-[#22D3EE]/10 px-2.5 py-1 text-[#A5F3FC]">
                            {request.attachmentName}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-[#334155] bg-[#0F172A] p-6 text-center">
                  <div>
                    <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#22D3EE]/10 text-[#22D3EE]">
                      <FileText size={23} />
                    </div>
                    <p className="mt-3 font-bold text-[#E5E7EB]">
                      Belum ada pengajuan untuk akun ini.
                    </p>
                    <p className="mt-1 text-sm text-[#94A3B8]">
                      Data hanya menampilkan pengajuan milik karyawan yang sedang login.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </EmployeeShell>
  );
}
