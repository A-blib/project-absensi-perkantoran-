"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Send,
  Timer,
  XCircle,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import {
  readEmployeeLeaveRequests,
  saveEmployeeLeaveRequest,
} from "@/lib/browser/employee-leave-store";

const defaultRequests = [
  {
    id: "default-cuti-2026-06-10",
    type: "Cuti",
    date: "10/06/2026 - 12/06/2026",
    status: "Menunggu",
    tone: "amber",
    Icon: Timer,
  },
  {
    id: "default-sakit-2026-05-28",
    type: "Sakit",
    date: "28/05/2026",
    status: "Disetujui",
    tone: "emerald",
    Icon: CheckCircle2,
  },
  {
    id: "default-izin-2026-05-22",
    type: "Izin",
    date: "22/05/2026",
    status: "Ditolak",
    tone: "red",
    Icon: XCircle,
  },
];

const tones = {
  amber: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  emerald: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  red: "border-red-300/30 bg-red-300/10 text-red-200",
};

const icons = {
  Menunggu: Timer,
  Disetujui: CheckCircle2,
  Ditolak: XCircle,
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

export default function EmployeeLeavePage() {
  const [requestType, setRequestType] = useState("Izin");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [storedRequests, setStoredRequests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStoredRequests(readEmployeeLeaveRequests());
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  const requests = useMemo(() => {
    const savedRequests = storedRequests.map((request) => ({
      id: request.id,
      type: request.type,
      date: request.dateRange,
      status: request.status,
      tone: "amber",
      Icon: icons[request.status] || Timer,
    }));

    return [...savedRequests, ...defaultRequests];
  }, [storedRequests]);

  function handleSubmit(event) {
    event.preventDefault();

    if (!startDate || !endDate || !reason.trim()) {
      setNotice({
        type: "error",
        message: "Lengkapi tanggal mulai, tanggal selesai, dan alasan.",
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

    setTimeout(() => {
      const request = {
        id: `leave-${Date.now()}`,
        type: requestType,
        dateRange: getDateRange(startDate, endDate),
        startDate,
        endDate,
        reason: reason.trim(),
        attachmentName,
        status: "Menunggu",
        submittedAt: new Date().toISOString(),
      };

      const nextRequests = saveEmployeeLeaveRequest(request);
      setStoredRequests(nextRequests);
      setRequestType("Izin");
      setStartDate("");
      setEndDate("");
      setReason("");
      setAttachmentName("");
      setNotice({
        type: "success",
        message: "Pengajuan berhasil dikirim dan menunggu persetujuan.",
      });
      setIsSubmitting(false);
    }, 500);
  }

  return (
    <EmployeeShell>
      {notice ? (
        <div
          className={[
            "fixed right-4 top-20 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl",
            notice.type === "success"
              ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100 shadow-emerald-400/20"
              : "border-amber-300/35 bg-amber-400/15 text-amber-100 shadow-amber-400/20",
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

      <div className="mb-5">
        <p className="text-sm text-slate-400">Form pegawai</p>
        <h2 className="text-3xl font-semibold text-white">Pengajuan Izin</h2>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/10 backdrop-blur-2xl"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Jenis pengajuan
              </span>
              <select
                value={requestType}
                onChange={(event) => setRequestType(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-cyan-300/15 bg-[#0A0F2C] px-4 text-sm text-slate-100 outline-none"
              >
                <option>Izin</option>
                <option>Sakit</option>
                <option>Cuti</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Tanggal mulai
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  if (!endDate) setEndDate(event.target.value);
                }}
                required
                className="mt-2 min-h-12 w-full rounded-2xl border border-cyan-300/15 bg-[#0A0F2C] px-4 text-sm text-slate-100 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Tanggal selesai
              </span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                required
                className="mt-2 min-h-12 w-full rounded-2xl border border-cyan-300/15 bg-[#0A0F2C] px-4 text-sm text-slate-100 outline-none"
              />
            </label>
            <label className="rounded-2xl border border-dashed border-cyan-300/35 bg-cyan-300/10 p-4">
              <input
                type="file"
                className="sr-only"
                onChange={(event) =>
                  setAttachmentName(event.target.files?.[0]?.name || "")
                }
              />
              <div className="flex min-h-20 items-center justify-center gap-3 text-sm font-semibold text-cyan-100">
                <FileUp size={21} />
                <span className="truncate">
                  {attachmentName || "Lampiran dokumen"}
                </span>
              </div>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-300">Alasan</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, 240))}
              required
              rows={6}
              className="mt-2 w-full resize-none rounded-2xl border border-cyan-300/15 bg-[#0A0F2C]/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="Tuliskan alasan pengajuan"
            />
            <span className="mt-2 block text-right text-xs text-slate-500">
              {reason.length}/240 karakter
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#6C3CE8] px-5 font-semibold text-white shadow-lg shadow-cyan-400/20 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
          >
            <Send size={18} />
            {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
          </button>
        </form>

        <aside className="rounded-[28px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/10 backdrop-blur-2xl">
          <h3 className="text-lg font-semibold text-white">
            Status Pengajuan
          </h3>
          <div className="mt-4 grid gap-3">
            {requests.map(({ id, type, date, status, tone, Icon }) => (
              <div
                key={id}
                className="rounded-2xl border border-white/10 bg-[#0A0F2C]/45 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{type}</p>
                    <p className="mt-1 text-sm text-slate-400">{date}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}
                  >
                    <Icon size={14} />
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </EmployeeShell>
  );
}
