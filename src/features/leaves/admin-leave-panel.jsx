"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Search,
  Timer,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const statusOptions = ["Semua", "Menunggu", "Disetujui", "Ditolak"];
const dateFilterOptions = [
  { value: "today", label: "Hari Ini" },
  { value: "all", label: "Semua" },
];

const statusStyles = {
  Menunggu: "border-amber-200 bg-amber-50 text-amber-700",
  Disetujui: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Ditolak: "border-red-200 bg-red-50 text-red-700",
};

const statusIcons = {
  Menunggu: Timer,
  Disetujui: CheckCircle2,
  Ditolak: XCircle,
};

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

function getJakartaDateKey(value = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  return formatter.format(new Date(value));
}

function isSubmittedToday(request) {
  return getJakartaDateKey(request.submittedAt) === getJakartaDateKey();
}

export function AdminLeavePanel({ initialRequests }) {
  const [requests, setRequests] = useState(initialRequests);
  const [activeStatus, setActiveStatus] = useState("Semua");
  const [dateFilter, setDateFilter] = useState("today");
  const [query, setQuery] = useState("");
  const todayRequests = useMemo(
    () => requests.filter((request) => isSubmittedToday(request)),
    [requests],
  );
  const initialActiveRequest = todayRequests[0] || initialRequests[0] || null;
  const [activeRequestId, setActiveRequestId] = useState(
    initialActiveRequest?.id || null,
  );
  const [adminNote, setAdminNote] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [savingDecision, setSavingDecision] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);

  useEffect(() => {
    let active = true;

    async function refreshRequests() {
      try {
        const response = await fetch("/api/admin/leave-requests", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const payload = await response.json();

        if (active && response.status === 401) {
          window.location.replace("/employee");
          return;
        }

        if (active && response.ok && payload.requests) {
          setRequests(payload.requests);
        }
      } catch {
        // Initial server data remains available if a background refresh fails.
      }
    }

    const interval = window.setInterval(refreshRequests, 60000);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") refreshRequests();
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const filteredRequests = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesDate = dateFilter === "all" || isSubmittedToday(request);
      const matchesStatus =
        activeStatus === "Semua" || request.status === activeStatus;
      const matchesQuery = keyword
        ? `${request.employeeName} ${request.employeeCode} ${request.division} ${request.type} ${request.reason}`
            .toLowerCase()
            .includes(keyword)
        : true;

      return matchesDate && matchesStatus && matchesQuery;
    });
  }, [activeStatus, dateFilter, query, requests]);

  const activeRequest =
    requests.find((request) => request.id === activeRequestId) ||
    filteredRequests[0] ||
    null;

  const summary = useMemo(
    () => ({
      total: requests.length,
      today: todayRequests.length,
      todayPending: todayRequests.filter((request) => request.status === "Menunggu").length,
      pending: requests.filter((request) => request.status === "Menunggu").length,
      approved: requests.filter((request) => request.status === "Disetujui").length,
      rejected: requests.filter((request) => request.status === "Ditolak").length,
    }),
    [requests, todayRequests],
  );

  async function decideRequest(status) {
    if (!activeRequest || activeRequest.status !== "Menunggu") return;

    setSavingDecision(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/leave-requests/${activeRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });
      const result = await response.json();

      if (response.status === 401) {
        window.location.replace("/employee");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Keputusan gagal disimpan.");
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === result.request.id ? result.request : request,
        ),
      );
      setAdminNote("");
      setMessageType("success");
      setMessage(`Pengajuan berhasil ${status.toLowerCase()}.`);
    } catch (error) {
      setMessageType("error");
      setMessage(error.message || "Keputusan gagal disimpan.");
    } finally {
      setSavingDecision(false);
    }
  }

  return (
    <div className="grid gap-6">
      {previewAttachment ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-950">
                  Lampiran Pengajuan
                </p>
                <p className="truncate text-xs text-slate-500">
                  {previewAttachment.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="Tutup preview lampiran"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
              {previewAttachment.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewAttachment.data}
                  alt={`Lampiran ${previewAttachment.name}`}
                  className="mx-auto max-h-[75vh] max-w-full rounded-lg bg-white object-contain shadow"
                />
              ) : (
                <iframe
                  src={previewAttachment.data}
                  title={`Lampiran ${previewAttachment.name}`}
                  className="h-[75vh] w-full rounded-lg bg-white"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
          Leave Approval
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              Pengelolaan Izin Pegawai
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Review pengajuan izin, sakit, dan cuti. Admin dapat menyetujui,
              Default halaman ini menampilkan pengajuan yang dikirim hari ini
              lengkap dengan nama, divisi, jabatan, status, dan alasan.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            {[
              ["Hari Ini", summary.today],
              ["Pending", summary.todayPending],
              ["Approve", summary.approved],
              ["Reject", summary.rejected],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {message ? (
        <div
          className={[
            "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold",
            messageType === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          ].join(" ")}
        >
          {messageType === "error" ? <TriangleAlert size={18} /> : <CheckCircle2 size={18} />}
          {message}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-950">
                  Pengajuan {dateFilter === "today" ? "Hari Ini" : "Semua Pengajuan"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {dateFilter === "today"
                    ? "Langsung menampilkan pegawai yang mengajukan izin pada hari ini."
                    : "Menampilkan semua riwayat pengajuan izin."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {dateFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setDateFilter(option.value);
                      setActiveRequestId(null);
                    }}
                    className={[
                      "inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-bold",
                      dateFilter === option.value
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <CalendarDays size={16} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  placeholder="Cari nama, divisi, alasan..."
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setActiveStatus(status);
                    setActiveRequestId(null);
                  }}
                  className={[
                    "h-11 rounded-lg border px-4 text-sm font-bold",
                    activeStatus === status
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {status}
                </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredRequests.length ? (
              filteredRequests.map((request) => {
                const StatusIcon = statusIcons[request.status];
                const isActive = activeRequest?.id === request.id;

                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => {
                      setActiveRequestId(request.id);
                      setAdminNote(request.adminNote || "");
                    }}
                    className={[
                      "grid w-full gap-3 px-5 py-4 text-left transition hover:bg-slate-50 lg:grid-cols-[1fr_auto]",
                      isActive ? "bg-blue-50/60" : "",
                    ].join(" ")}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-950">
                          {request.employeeName}
                        </p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                          {request.employeeCode}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {request.division} - {request.position}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {request.type} | {request.dateRange}
                      </p>
                    </div>
                    <span
                      className={[
                        "inline-flex h-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold",
                        statusStyles[request.status],
                      ].join(" ")}
                    >
                      <StatusIcon size={14} />
                      {request.status}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm font-semibold text-slate-500">
                {dateFilter === "today"
                  ? "Belum ada pegawai yang mengajukan izin hari ini."
                  : "Belum ada pengajuan yang cocok dengan filter."}
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {activeRequest ? (
            <div className="grid gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                    Detail Pengajuan
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    {activeRequest.employeeName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Dikirim {formatDateTime(activeRequest.submittedAt)}
                  </p>
                </div>
                <ClipboardCheck className="text-blue-600" size={24} />
              </div>

              <div className="grid gap-3 text-sm">
                <InfoRow label="Jenis" value={activeRequest.type} />
                <InfoRow label="Tanggal" value={activeRequest.dateRange} />
                <InfoRow label="Email" value={activeRequest.employeeEmail} />
                <InfoRow label="Nomor Telepon" value={activeRequest.employeePhone || "-"} />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Lampiran
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {activeRequest.attachmentName || "Tidak ada lampiran"}
                    </p>
                  </div>
                  {activeRequest.attachmentData ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewAttachment({
                          name: activeRequest.attachmentName || "lampiran-izin",
                          type: activeRequest.attachmentType,
                          data: activeRequest.attachmentData,
                        })
                      }
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Eye size={15} />
                      Preview
                    </button>
                  ) : null}
                </div>

                {activeRequest.attachmentData ? (
                  activeRequest.attachmentType?.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeRequest.attachmentData}
                      alt={`Lampiran ${activeRequest.attachmentName}`}
                      className="mt-4 max-h-64 w-full rounded-lg border border-slate-200 object-contain bg-white"
                    />
                  ) : (
                    <a
                      href={activeRequest.attachmentData}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex min-h-16 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <ExternalLink size={17} />
                      Lihat Dokumen PDF
                    </a>
                  )
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Pegawai tidak melampirkan dokumen pendukung.
                  </p>
                )}
                {activeRequest.attachmentData ? (
                  <a
                    href={activeRequest.attachmentData}
                    download={activeRequest.attachmentName || "lampiran-izin"}
                    className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:underline"
                  >
                    <Download size={14} />
                    Unduh lampiran
                  </a>
                ) : null}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Alasan
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {activeRequest.reason}
                </p>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Catatan Admin
                <textarea
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value.slice(0, 240))}
                  rows={4}
                  disabled={activeRequest.status !== "Menunggu"}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 outline-none disabled:bg-slate-50"
                  placeholder="Tambahkan catatan keputusan"
                />
              </label>

              {activeRequest.status === "Menunggu" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    onClick={() => decideRequest("Disetujui")}
                    disabled={savingDecision}
                  >
                    <CheckCircle2 size={18} />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => decideRequest("Ditolak")}
                    disabled={savingDecision}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <XCircle size={18} />
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Pengajuan sudah {activeRequest.status.toLowerCase()} pada{" "}
                  {formatDateTime(activeRequest.decidedAt)}.
                  {activeRequest.adminNote ? (
                    <p className="mt-2 font-semibold text-slate-700">
                      Catatan: {activeRequest.adminNote}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center text-center text-sm text-slate-500">
              <div>
                <FileText className="mx-auto mb-3 text-slate-300" size={36} />
                Pilih pengajuan untuk melihat detail.
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-950">{value}</span>
    </div>
  );
}
