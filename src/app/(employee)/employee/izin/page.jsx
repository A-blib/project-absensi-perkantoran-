"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  FileUp,
  Info,
  Loader2,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { saveEmployeeLeaveRequest } from "@/lib/browser/employee-leave-store";
import { createEmployeeNotification } from "@/lib/browser/employee-notification-store";

const requestTypes = ["Izin", "Sakit", "Cuti", "Dispensasi"];
const maxFileSize = 2 * 1024 * 1024;
const allowedFileTypes = ["application/pdf", "image/jpeg", "image/png"];

const emptyForm = {
  type: "",
  startDate: "",
  endDate: "",
  reason: "",
  attachment: null,
};

function dateRangeLabel(startDate, endDate) {
  if (!startDate && !endDate) return "-";
  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
  const start = formatter.format(new Date(`${startDate}T00:00:00+07:00`));
  const end = formatter.format(new Date(`${endDate}T00:00:00+07:00`));
  return startDate === endDate ? start : `${start} - ${end}`;
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-2 text-xs font-semibold text-[#FCA5A5]">{message}</p>;
}

function SummaryCard({ label, value, Icon, color }) {
  return (
    <div
      className="group relative min-h-[96px] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,#1C2B43_0%,#132036_58%,#0C1627_100%)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.34),0_0_0_1px_rgba(56,189,248,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#38BDF8]/45 hover:shadow-[0_22px_48px_rgba(0,0,0,0.38)]"
      style={{ boxShadow: `0 18px 40px rgba(0,0,0,.34), 0 0 28px ${color}12` }}
    >
      <div className="absolute inset-x-0 top-0 h-px opacity-80" style={{ background: color }} />
      <div className="absolute bottom-0 left-0 top-0 w-1 opacity-90" style={{ background: color }} />
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C7D2FE]">
          {label}
        </p>
        <div
          className="grid size-10 place-items-center rounded-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          style={{ background: `${color}24` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="relative mt-2 text-2xl font-extrabold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

export default function EmployeeLeavePage() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const summaryCards = useMemo(
    () => [
      ["Total", summary.total, FileText, "#38BDF8"],
      ["Setuju", summary.approved, ShieldCheck, "#22C55E"],
      ["Tunggu", summary.pending, Clock3, "#F59E0B"],
      ["Tolak", summary.rejected, XCircle, "#EF4444"],
    ],
    [summary],
  );

  const loadSummary = useCallback(async ({ signal } = {}) => {
    const response = await fetch("/api/employee/leave-requests?page=1&pageSize=1", {
      cache: "no-store",
      signal,
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Gagal mengambil ringkasan pengajuan.");
    }

    setSummary(
      payload.summary || {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      },
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function initialLoad() {
      try {
        setIsLoadingSummary(true);
        await loadSummary({ signal: controller.signal });
      } catch (error) {
        if (error.name !== "AbortError") {
          setNotice({ type: "error", message: error.message });
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingSummary(false);
      }
    }

    initialLoad();
    return () => controller.abort();
  }, [loadSummary]);

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

      setSummary((current) => ({
        total: current.total + 1,
        approved: current.approved,
        pending: current.pending + 1,
        rejected: current.rejected,
      }));
      saveEmployeeLeaveRequest({
        ...payload.request,
        createdAt: payload.request.createdAt || new Date().toISOString(),
      });
      setForm(emptyForm);
      setErrors({});
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
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
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

      <div className="mx-auto max-w-[1440px] space-y-5 pb-12">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-[#A7B3C6]">Leave request</p>
            <h2 className="mt-1 text-2xl font-bold text-[#F8FAFC] sm:text-3xl">
              Pengajuan Izin
            </h2>
            <p className="mt-1 text-sm text-[#A7B3C6]">
              Buat pengajuan cuti, izin, sakit, atau dispensasi untuk diproses HR.
            </p>
          </div>
          <Link
            href="/employee/riwayat-izin"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#60A5FA] bg-[#142136] px-5 text-sm font-bold text-[#F8FAFC] transition hover:bg-[#223754]"
          >
            <FileCheck2 size={17} />
            Riwayat Pengajuan
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(([label, value, Icon, color]) => (
            <SummaryCard
              key={label}
              label={label}
              value={isLoadingSummary ? "..." : value}
              Icon={Icon}
              color={color}
            />
          ))}
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,65fr)_minmax(280px,35fr)]">
          <form
            onSubmit={handleSubmit}
            className="relative h-fit self-start overflow-hidden rounded-2xl border border-[#3B82F6]/35 bg-[linear-gradient(145deg,#1B2A44_0%,#13243B_48%,#0D1728_100%)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.38),0_0_0_1px_rgba(56,189,248,0.08),0_0_34px_rgba(56,189,248,0.08)] sm:p-6"
            noValidate
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#38BDF8,#22C55E,#F59E0B)]" />
            <div className="absolute right-5 top-5 h-24 w-24 rounded-full bg-[#38BDF8]/10 blur-2xl" />
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="relative">
                <h3 className="text-xl font-extrabold text-[#F8FAFC]">
                  Form Pengajuan Izin
                </h3>
                <p className="mt-1 text-sm text-[#A7B3C6]">
                  Lengkapi data berikut agar admin bisa memproses lebih cepat.
                </p>
              </div>
              <div className="relative grid size-11 shrink-0 place-items-center rounded-2xl border border-[#38BDF8]/35 bg-[#38BDF8]/15 text-[#38BDF8] shadow-[0_12px_28px_rgba(56,189,248,0.16)]">
                <FileText size={22} />
              </div>
            </div>

            <div className="relative grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-[#E5E7EB]">Jenis Pengajuan</span>
                <select
                  value={form.type}
                  onChange={(event) => updateForm("type", event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[#2D4568] bg-[#0D1728] px-3 text-sm font-semibold text-[#F8FAFC] outline-none transition hover:border-[#38BDF8] focus:border-[#38BDF8] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.12)]"
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
                <span className="mt-2 flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#38BDF8]/45 bg-[#0D1728] px-3 text-sm font-semibold text-[#F8FAFC] transition hover:border-[#38BDF8] hover:bg-[#142136]">
                  <FileUp size={17} className="text-[#38BDF8]" />
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
                  className="mt-2 h-11 w-full rounded-xl border border-[#2D4568] bg-[#0D1728] px-3 text-sm font-semibold text-[#F8FAFC] outline-none transition hover:border-[#38BDF8] focus:border-[#38BDF8] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.12)]"
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
                  className="mt-2 h-11 w-full rounded-xl border border-[#2D4568] bg-[#0D1728] px-3 text-sm font-semibold text-[#F8FAFC] outline-none transition hover:border-[#38BDF8] focus:border-[#38BDF8] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.12)]"
                />
                <FieldError message={errors.endDate} />
              </label>
            </div>

            <label className="relative mt-4 block">
              <span className="text-sm font-bold text-[#E5E7EB]">Alasan Pengajuan</span>
              <textarea
                value={form.reason}
                onChange={(event) => updateForm("reason", event.target.value.slice(0, 240))}
                rows={5}
                className="mt-2 min-h-[132px] w-full resize-none rounded-xl border border-[#2D4568] bg-[#0D1728] px-3 py-3 text-sm leading-6 text-[#F8FAFC] outline-none transition placeholder:text-[#94A3B8] hover:border-[#38BDF8] focus:border-[#38BDF8] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.12)]"
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
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#2563EB,#22D3EE)] px-5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(37,99,235,.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(34,211,238,.2)] disabled:pointer-events-none disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
              {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
            </button>
          </form>

          <aside className="relative h-fit self-start overflow-hidden rounded-2xl border border-[#60A5FA]/30 bg-[linear-gradient(145deg,#1A2A42_0%,#122139_55%,#0C1627_100%)] p-5 shadow-[0_24px_58px_rgba(0,0,0,0.34),0_0_0_1px_rgba(96,165,250,0.08)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#60A5FA,#A78BFA,#22C55E)]" />
            <div className="absolute -right-8 top-10 h-28 w-28 rounded-full bg-[#A78BFA]/10 blur-2xl" />
            <div className="relative flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#38BDF8]/35 bg-[#38BDF8]/15 text-[#38BDF8] shadow-[0_10px_24px_rgba(56,189,248,0.14)]">
                <Info size={20} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#F8FAFC]">Informasi Pengajuan</h3>
                <p className="mt-1 text-sm leading-6 text-[#A7B3C6]">
                  Pengajuan yang dikirim akan langsung masuk ke database dan muncul di riwayat.
                </p>
              </div>
            </div>

            <div className="relative mt-5 space-y-3 text-sm">
              {[
                ["Lampiran", "Gunakan PDF, JPG, atau PNG dengan ukuran maksimal 2 MB."],
                ["Tanggal", "Pastikan rentang tanggal sesuai kebutuhan pengajuan."],
                ["Status", "Status awal adalah Menunggu sampai diproses admin."],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[rgba(96,165,250,0.26)] bg-[linear-gradient(145deg,#101D31,#0D1728)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <p className="font-bold text-[#F8FAFC]">{label}</p>
                  <p className="mt-1 leading-5 text-[#A7B3C6]">{value}</p>
                </div>
              ))}
            </div>

            <div className="employee-leave-history-note relative mt-5 rounded-xl border border-[#22C55E]/30 bg-[linear-gradient(145deg,rgba(34,197,94,0.15),rgba(13,23,40,0.86))] p-3 text-sm text-[#BBF7D0] shadow-[0_12px_26px_rgba(34,197,94,0.08)]">
              <div className="flex items-center gap-2 font-bold">
                <CalendarDays size={16} />
                Riwayat otomatis diperbarui
              </div>
              <p className="mt-1 leading-5 text-[#D1FAE5]/80">
                Buka menu Riwayat Pengajuan Izin untuk melihat filter, detail, dan lampiran.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </EmployeeShell>
  );
}
