"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  FileUp,
  Send,
  Timer,
  XCircle,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { useCurrentUser } from "@/lib/browser/use-current-user";
import { createEmployeeNotification } from "@/lib/browser/employee-notification-store";

const REQUESTS_PER_PAGE = 5;
const MAX_ATTACHMENT_SIZE = 1.5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const statusStyles = {
  Menunggu: {
    icon: Timer,
    className: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  },
  Disetujui: {
    icon: CheckCircle2,
    className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  },
  Ditolak: {
    icon: XCircle,
    className: "border-red-400/25 bg-red-400/10 text-red-300",
  },
};

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function getDateRange(startDate, endDate) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return start === end ? start : `${start} - ${end}`;
}

function formatDecisionTime(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default function EmployeeLeavePage() {
  const { user } = useCurrentUser();
  const ownerKey = user?.id;
  const [requestType, setRequestType] = useState("Izin");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentType, setAttachmentType] = useState("");
  const [attachmentData, setAttachmentData] = useState("");
  const [storedRequests, setStoredRequests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [notice, setNotice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!ownerKey) return undefined;

    let active = true;

    async function loadRequests({ showError = false } = {}) {
      try {
        const response = await fetch("/api/employee/leave-requests", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || "Status pengajuan gagal dimuat.");
        }

        if (!active) return;

        payload.requests.forEach((request) => {
          if (!["Disetujui", "Ditolak"].includes(request.status)) return;

          const approved = request.status === "Disetujui";
          createEmployeeNotification(
            {
              id: `leave-decision-${request.id}-${request.status}`,
              title: approved ? "Pengajuan izin disetujui" : "Pengajuan izin ditolak",
              message: `${request.type} tanggal ${request.dateRange} ${request.status.toLowerCase()} oleh admin.${request.adminNote ? ` Catatan: ${request.adminNote}` : ""}`,
              category: "izin",
              type: approved ? "success" : "danger",
              createdAt: request.decidedAt || request.submittedAt,
            },
            ownerKey,
          );
        });

        setStoredRequests(payload.requests);
      } catch (error) {
        if (active && showError) {
          setNotice({
            type: "error",
            message: error.message || "Status pengajuan gagal dimuat.",
          });
        }
      } finally {
        if (active) setIsLoadingRequests(false);
      }
    }

    loadRequests({ showError: true });
    const interval = window.setInterval(loadRequests, 15000);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") loadRequests();
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [ownerKey]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  const requests = useMemo(() => {
    return storedRequests.map((request) => ({
      id: request.id,
      type: request.type,
      date: request.dateRange || request.date,
      status: request.status,
      reason: request.reason,
      attachmentName: request.attachmentName,
      adminNote: request.adminNote,
      decidedAt: request.decidedAt,
      submittedAt: request.submittedAt,
    }));
  }, [storedRequests]);

  const totalPages = Math.max(1, Math.ceil(requests.length / REQUESTS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const pageStart = (activePage - 1) * REQUESTS_PER_PAGE;
  const paginatedRequests = requests.slice(
    pageStart,
    pageStart + REQUESTS_PER_PAGE,
  );
  const monthlySummary = useMemo(() => {
    return {
      total: requests.length,
      approved: requests.filter(
        (request) => request.status === "Disetujui",
      ).length,
      pending: requests.filter(
        (request) => request.status === "Menunggu",
      ).length,
    };
  }, [requests]);

  function handleSubmit(event) {
    event.preventDefault();

    if (!startDate || !endDate || !reason.trim()) {
      setNotice({
        type: "error",
        message: "Lengkapi tanggal mulai, tanggal selesai, dan alasan.",
      });
      return;
    }

    if (!attachmentData || !attachmentName || !attachmentType) {
      setNotice({
        type: "error",
        message: "Lampiran dokumen wajib dipilih sebelum mengirim pengajuan.",
      });
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setNotice({
        type: "error",
        message: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.",
      });
      return;
    }

    setIsSubmitting(true);

    async function submitRequest() {
      const request = {
        type: requestType,
        startDate,
        endDate,
        reason: reason.trim(),
        attachmentName,
        attachmentType,
        attachmentData,
      };

      try {
        const response = await fetch("/api/employee/leave-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Pengajuan gagal dikirim.");
        }

        const savedRequest = result.request;
        createEmployeeNotification(
          {
            title: "Pengajuan izin dikirim",
            message: `${savedRequest.type} tanggal ${savedRequest.dateRange} menunggu persetujuan admin.`,
            category: "izin",
            type: "info",
          },
          ownerKey,
        );
        setStoredRequests((current) => [savedRequest, ...current]);
        setCurrentPage(1);
        setRequestType("Izin");
        setStartDate("");
        setEndDate("");
        setReason("");
        setAttachmentName("");
        setAttachmentType("");
        setAttachmentData("");
        setNotice({
          type: "success",
          message: "Pengajuan berhasil dikirim dan menunggu persetujuan admin.",
        });
      } catch (error) {
        setNotice({
          type: "error",
          message:
            error.message ||
            "Pengajuan gagal dikirim. Pastikan database izin sudah aktif.",
        });
      } finally {
        setIsSubmitting(false);
      }
    }

    submitRequest();
  }

  function handleAttachmentChange(file) {
    if (!file) {
      setAttachmentName("");
      setAttachmentType("");
      setAttachmentData("");
      return;
    }

    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
      setNotice({
        type: "error",
        message: "Lampiran harus berupa JPG, PNG, WebP, atau PDF.",
      });
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      setNotice({
        type: "error",
        message: "Ukuran lampiran maksimal 1.5MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentName(file.name);
      setAttachmentType(file.type);
      setAttachmentData(String(reader.result || ""));
    };
    reader.onerror = () => {
      setNotice({
        type: "error",
        message: "Lampiran gagal dibaca. Coba pilih file lain.",
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <EmployeeShell initialUser={user}>
      {notice ? (
        <div
          className={[
            "fixed right-4 top-24 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl",
            notice.type === "success"
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
              : "border-amber-400/25 bg-amber-400/10 text-amber-200",
          ].join(" ")}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}
          {notice.message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#8B9DB5]">Leave management</p>
              <h2 className="mt-1 text-2xl font-bold text-[#d4e4fa]">
                Pengajuan Izin
              </h2>
            </div>
            <div className="grid size-12 place-items-center rounded-2xl bg-[#3b82f6]/15 text-[#60a5fa]">
              <FileText size={24} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-[#c2c6d6]">
                Jenis Pengajuan
              </span>
              <select
                value={requestType}
                onChange={(event) => setRequestType(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#24344D] bg-[#0B1220] px-4 text-sm text-[#d4e4fa] outline-none transition focus:border-[#3b82f6]"
              >
                <option>Izin</option>
                <option>Sakit</option>
                <option>Cuti</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#c2c6d6]">
                Lampiran Dokumen <span className="text-red-300">*</span>
              </span>
              <span className="mt-2 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[#3b82f6]/35 bg-[#3b82f6]/10 px-4 text-sm font-semibold text-[#d4e4fa]">
                <FileUp size={18} className="text-[#60a5fa]" />
                <span className="truncate">
                  {attachmentName || "Pilih file pendukung"}
                </span>
                <input
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="sr-only"
                  onChange={(event) => handleAttachmentChange(event.target.files?.[0])}
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#c2c6d6]">
                Tanggal Mulai
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  if (!endDate) setEndDate(event.target.value);
                }}
                required
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#24344D] bg-[#0B1220] px-4 text-sm text-[#d4e4fa] outline-none transition focus:border-[#3b82f6]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#c2c6d6]">
                Tanggal Selesai
              </span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                required
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#24344D] bg-[#0B1220] px-4 text-sm text-[#d4e4fa] outline-none transition focus:border-[#3b82f6]"
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-medium text-[#c2c6d6]">Alasan</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, 240))}
              required
              rows={7}
              className="mt-2 w-full resize-none rounded-2xl border border-[#24344D] bg-[#0B1220] px-4 py-3 text-sm leading-6 text-[#d4e4fa] outline-none transition placeholder:text-[#64748b] focus:border-[#3b82f6]"
              placeholder="Tuliskan alasan pengajuan secara singkat"
            />
            <span className="mt-2 block text-right text-xs text-[#8B9DB5]">
              {reason.length}/240 karakter
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#3b82f6] px-5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-[#60a5fa] disabled:pointer-events-none disabled:opacity-60"
          >
            <Send size={19} />
            {isSubmitting ? "Mengirim Pengajuan..." : "Kirim Pengajuan"}
          </button>
        </form>

        <aside className="space-y-6">
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-bold text-[#d4e4fa]">
              Ringkasan Pengajuan
            </h3>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                ["Total", monthlySummary.total],
                ["Disetujui", monthlySummary.approved],
                ["Menunggu", monthlySummary.pending],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#0B1220] p-4">
                  <p className="text-xs text-[#8B9DB5]">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-[#d4e4fa]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#d4e4fa]">
                  Status Pengajuan
                </h3>
                <p className="mt-1 text-xs text-[#8B9DB5]">
                  {requests.length
                    ? `Menampilkan ${pageStart + 1}-${Math.min(
                        pageStart + REQUESTS_PER_PAGE,
                        requests.length,
                      )} dari ${requests.length} pengajuan`
                    : "Belum ada pengajuan izin"}
                </p>
              </div>
              <CalendarDays size={20} className="text-[#60a5fa]" />
            </div>
            <div className="min-h-[384px] space-y-3">
              {paginatedRequests.map((request) => {
                const StatusIcon = statusStyles[request.status].icon;

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-[#24344D] bg-[#0B1220] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[#d4e4fa]">
                          {request.type}
                        </p>
                        <p className="mt-1 text-sm text-[#8B9DB5]">
                          {request.date}
                        </p>
                      </div>
                      <span
                        className={[
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                          statusStyles[request.status].className,
                        ].join(" ")}
                      >
                        <StatusIcon size={14} />
                        {request.status}
                      </span>
                    </div>
                    {request.status !== "Menunggu" ? (
                      <div
                        className={[
                          "mt-3 rounded-xl border px-3 py-3 text-sm",
                          request.status === "Disetujui"
                            ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-100"
                            : "border-red-400/20 bg-red-400/[0.07] text-red-100",
                        ].join(" ")}
                      >
                        <p className="font-semibold">
                          {request.status === "Disetujui"
                            ? "Permohonan kamu telah disetujui."
                            : "Permohonan kamu tidak disetujui."}
                        </p>
                        {request.adminNote ? (
                          <p className="mt-1 text-[#c2c6d6]">
                            Catatan admin: {request.adminNote}
                          </p>
                        ) : null}
                        {request.decidedAt ? (
                          <p className="mt-2 text-xs text-[#8B9DB5]">
                            Diproses {formatDecisionTime(request.decidedAt)}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs leading-5 text-[#8B9DB5]">
                        Menunggu admin memeriksa alasan dan lampiran{" "}
                        {request.attachmentName || "pengajuan"}.
                      </p>
                    )}
                  </div>
                );
              })}
              {!paginatedRequests.length ? (
                <div className="grid min-h-[300px] place-items-center rounded-2xl border border-dashed border-[#24344D] text-center">
                  <div>
                    <FileText className="mx-auto text-[#3b82f6]" size={32} />
                    <p className="mt-3 font-semibold text-[#d4e4fa]">
                      {isLoadingRequests
                        ? "Memuat status pengajuan..."
                        : "Belum ada pengajuan"}
                    </p>
                    <p className="mt-1 text-sm text-[#8B9DB5]">
                      Pengajuan yang dikirim akan tampil di sini.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="mt-5 flex flex-col gap-3 border-t border-[#24344D] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-[#8B9DB5]">
                Halaman {activePage} dari {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={activePage === 1}
                  className="grid size-10 place-items-center rounded-xl border border-[#24344D] bg-[#0B1220] text-[#d4e4fa] transition hover:border-[#3b82f6] disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={[
                        "grid size-10 place-items-center rounded-xl border text-sm font-bold transition",
                        activePage === page
                          ? "border-[#3b82f6] bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20"
                          : "border-[#24344D] bg-[#0B1220] text-[#c2c6d6] hover:border-[#3b82f6]",
                      ].join(" ")}
                      aria-label={`Halaman ${page}`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={activePage === totalPages}
                  className="grid size-10 place-items-center rounded-xl border border-[#24344D] bg-[#0B1220] text-[#d4e4fa] transition hover:border-[#3b82f6] disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </EmployeeShell>
  );
}
