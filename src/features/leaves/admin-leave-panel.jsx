"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
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
    <div className="grid gap-6 overflow-x-hidden">
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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Leave Approval
            </p>
            <h1 className="mt-1.5 text-2xl font-bold text-slate-950 sm:text-3xl">
              Pengelolaan Izin Pegawai
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
              Review dan putuskan pengajuan izin, sakit, dan cuti karyawan.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:shrink-0">
            {[
              { label: "Hari Ini", value: summary.today, color: "text-blue-600 bg-blue-50 border-blue-100" },
              { label: "Pending", value: summary.todayPending, color: "text-amber-600 bg-amber-50 border-amber-100" },
              { label: "Disetujui", value: summary.approved, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
              { label: "Ditolak", value: summary.rejected, color: "text-red-600 bg-red-50 border-red-100" },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl border px-4 py-3 text-center ${color}`}>
                <p className="text-xs font-bold uppercase tracking-wide opacity-60">{label}</p>
                <p className="mt-1 text-2xl font-extrabold">{value}</p>
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
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-950">
                  {dateFilter === "today" ? "Pengajuan Hari Ini" : "Semua Pengajuan"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {filteredRequests.length} pengajuan ditemukan
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {dateFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setDateFilter(option.value); setActiveRequestId(null); }}
                    className={[
                      "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition",
                      dateFilter === option.value
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <CalendarDays size={14} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                <Search size={16} className="shrink-0" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
                  placeholder="Cari nama, divisi, alasan..."
                />
              </label>
              <div className="flex gap-1.5">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => { setActiveStatus(status); setActiveRequestId(null); }}
                    className={[
                      "h-10 rounded-lg border px-3 text-sm font-semibold transition",
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
                      "w-full px-4 py-3.5 text-left transition hover:bg-slate-50",
                      isActive ? "bg-blue-50/60 hover:bg-blue-50/60" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-950">{request.employeeName}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                            {request.employeeCode}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {request.division} · {request.type} · {request.dateRange}
                        </p>
                      </div>
                      <span
                        className={[
                          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
                          statusStyles[request.status],
                        ].join(" ")}
                      >
                        <StatusIcon size={12} />
                        {request.status}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <div className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
                  <Search size={22} />
                </div>
                <p className="text-sm font-bold text-slate-700">Tidak ada pengajuan</p>
                <p className="text-xs text-slate-400">
                  {dateFilter === "today"
                    ? "Belum ada pegawai yang mengajukan izin hari ini."
                    : "Tidak ada pengajuan yang cocok dengan filter."}
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {activeRequest ? (
            <div className="flex flex-col gap-0">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                      Detail Pengajuan
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-950">
                      {activeRequest.employeeName}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Dikirim {formatDateTime(activeRequest.submittedAt)}
                    </p>
                  </div>
                  <span
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
                      statusStyles[activeRequest.status],
                    ].join(" ")}
                  >
                    {activeRequest.status}
                  </span>
                </div>
              </div>

              <div className="grid gap-2 p-5">
                {[
                  ["Jenis", activeRequest.type],
                  ["Tanggal", activeRequest.dateRange],
                  ["Divisi", activeRequest.division],
                  ["Email", activeRequest.employeeEmail],
                  ["Telepon", activeRequest.employeePhone || "-"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-500">{label}</span>
                    <span className="text-right font-bold text-slate-950">{value}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Alasan</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{activeRequest.reason}</p>
              </div>

              {activeRequest.attachmentData ? (
                <div className="border-t border-slate-100 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Lampiran</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment({ name: activeRequest.attachmentName || "lampiran", type: activeRequest.attachmentType, data: activeRequest.attachmentData })}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye size={13} />
                        Preview
                      </button>
                      <a
                        href={activeRequest.attachmentData}
                        download={activeRequest.attachmentName || "lampiran"}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Download size={13} />
                        Unduh
                      </a>
                    </div>
                  </div>
                  <p className="mt-1.5 truncate text-xs text-slate-500">{activeRequest.attachmentName}</p>
                </div>
              ) : null}

              <div className="border-t border-slate-100 p-5">
                {activeRequest.status === "Menunggu" ? (
                  <>
                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                      Catatan Admin
                      <textarea
                        value={adminNote}
                        onChange={(event) => setAdminNote(event.target.value.slice(0, 240))}
                        rows={3}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-blue-300"
                        placeholder="Tambahkan catatan (opsional)"
                      />
                    </label>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Button type="button" onClick={() => decideRequest("Disetujui")} disabled={savingDecision}>
                        <CheckCircle2 size={16} />
                        {savingDecision ? "..." : "Approve"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => decideRequest("Ditolak")} disabled={savingDecision} className="border-red-200 text-red-700 hover:bg-red-50">
                        <XCircle size={16} />
                        {savingDecision ? "..." : "Reject"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                    Diputuskan pada {formatDateTime(activeRequest.decidedAt)}.
                    {activeRequest.adminNote ? (
                      <p className="mt-1.5 font-semibold text-slate-700">Catatan: {activeRequest.adminNote}</p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center p-8 text-center text-sm text-slate-500">
              <div>
                <FileText className="mx-auto mb-3 text-slate-300" size={36} />
                <p className="font-medium">Pilih pengajuan untuk melihat detail.</p>
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
