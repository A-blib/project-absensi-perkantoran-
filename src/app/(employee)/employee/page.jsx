"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  BellRing,
  CalendarCheck2,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Fingerprint,
  Gauge,
  MapPinned,
  ScanFace,
  ShieldCheck,
  TimerReset,
  TrendingUp,
  X,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { saveEmployeeAttendanceByType } from "@/lib/browser/employee-attendance-store";

const summaryCards = [
  {
    label: "Status Hari Ini",
    value: "Hadir",
    tone: "text-emerald-600 dark:text-emerald-300",
    icon: CalendarCheck2,
  },
  {
    label: "Jam Masuk",
    value: "08:00 WIB",
    tone: "text-[#2563EB] dark:text-[#C4B5FD]",
    icon: Clock3,
  },
  {
    label: "Jam Pulang",
    value: "17:00 WIB",
    tone: "text-[#2563EB] dark:text-[#C4B5FD]",
    icon: TimerReset,
  },
  {
    label: "Persentase Kehadiran",
    value: "95%",
    tone: "text-[#061A58] dark:text-white",
    icon: Gauge,
    progress: 95,
  },
];

const monthStats = [
  ["Hadir", 18, 82, "from-emerald-400 to-cyan-300"],
  ["Terlambat", 2, 9, "from-amber-300 to-orange-400"],
  ["Izin", 1, 5, "from-sky-300 to-violet-400"],
  ["Sakit", 1, 5, "from-rose-300 to-red-400"],
  ["Cuti", 0, 0, "from-slate-300 to-slate-500"],
];

const workSignals = [
  ["Shift hari ini", "08:00 - 17:00", CalendarDays],
  ["Lokasi kerja", "Kantor Pusat Jakarta", MapPinned],
  ["Verifikasi", "Wajah & GPS aktif", ShieldCheck],
];

const notices = [
  ["Reminder", "Pengajuan cuti Juni menunggu persetujuan HR."],
  ["Jadwal", "Briefing finance pukul 09:30 di ruang meeting 2."],
];

function DigitalClock() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="font-mono text-[#2563EB] dark:text-[#C4B5FD]">
      {now
        ? now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "Asia/Jakarta",
          })
        : "--:--:--"}
    </span>
  );
}

function getStamp() {
  return new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function playSuccessSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) return;

  const audioContext = new AudioContext();
  [660, 880, 1175].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime + index * 0.12;

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.16);
  });

  setTimeout(() => audioContext.close(), 700);
}

export default function EmployeeHomePage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const autoDetectTimerRef = useRef(null);
  const [attendanceModal, setAttendanceModal] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modalNotice, setModalNotice] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [warningToast, setWarningToast] = useState("");
  const [watermark, setWatermark] = useState("");
  const [lastStatus, setLastStatus] = useState(
    "Absensi masuk tercatat pukul 08:00:22 WIB",
  );

  function stopCamera() {
    if (autoDetectTimerRef.current) {
      clearTimeout(autoDetectTimerRef.current);
      autoDetectTimerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(2, 6, 23, 0.62)";
    context.fillRect(18, canvas.height - 104, 300, 82);
    context.fillStyle = "#E2E8F0";
    context.font = "600 18px Arial";
    context.fillText(watermark, 34, canvas.height - 72);
    context.fillText("Rina Pratiwi", 34, canvas.height - 47);
    context.fillText("Kantor Pusat Jakarta", 34, canvas.height - 22);

    return canvas.toDataURL("image/jpeg", 0.88);
  }

  async function openAttendance(type) {
    setWatermark(getStamp());
    setFaceDetected(false);
    setModalNotice("Membuka kamera...");
    setCameraError("");
    setWarningToast("");
    setSaving(false);
    setAttendanceModal(type);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setModalNotice("Posisikan wajah di tengah kamera.");
      autoDetectTimerRef.current = setTimeout(() => {
        setFaceDetected(true);
        setModalNotice("Wajah terdeteksi. Absensi sudah bisa disimpan.");
      }, 1200);
    } catch {
      setCameraError("Kamera tidak bisa dibuka. Izinkan akses kamera browser.");
      setModalNotice("Kamera gagal dibuka.");
    }
  }

  function closeAttendanceModal() {
    stopCamera();
    setAttendanceModal(null);
  }

  function setManualFace(value) {
    setFaceDetected(value);
    setWarningToast("");
    setModalNotice(
      value
        ? "Wajah terdeteksi. Absensi sudah bisa disimpan."
        : "Wajah tidak terlihat. Absensi tidak bisa disimpan.",
    );
  }

  function saveAttendance() {
    if (!faceDetected) {
      setModalNotice("Absensi belum bisa disimpan karena wajah tidak terlihat.");
      setWarningToast("Wajah tidak terdeteksi. Absensi belum disimpan.");
      return;
    }

    const savedAt = getStamp();
    const time = savedAt.split(", ")[1] || "--:--:--";
    const photo = captureFrame();
    const label =
      attendanceModal === "masuk" ? "Absensi Masuk" : "Absensi Keluar";

    setSaving(true);
    setModalNotice("Wajah terdeteksi. Menyimpan foto absensi...");

    setTimeout(() => {
      saveEmployeeAttendanceByType(attendanceModal, {
        id: `attendance-${Date.now()}`,
        photo,
        savedAt,
        date: savedAt.split(",")[0],
        clockIn: attendanceModal === "masuk" ? time : "08:00:22",
        clockOut: attendanceModal === "keluar" ? time : "--:--:--",
        status: "Hadir",
        location: "Kantor Pusat Jakarta",
      });
      playSuccessSound();
      setToast(`${label} Berhasil`);
      setLastStatus(`${label.toLowerCase()} tercatat pukul ${time} WIB`);
      setSaving(false);
      closeAttendanceModal();
    }, 900);
  }

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!warningToast) return undefined;
    const timer = setTimeout(() => setWarningToast(""), 3200);
    return () => clearTimeout(timer);
  }, [warningToast]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <EmployeeShell>
      {toast ? (
        <div className="employee-toast fixed right-4 top-20 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-4 py-3 text-sm font-semibold text-emerald-100 shadow-2xl shadow-emerald-400/20 backdrop-blur-xl">
          <CheckCircle2 size={18} className="text-emerald-300" />
          {toast}
        </div>
      ) : null}
      {warningToast ? (
        <div className="employee-toast fixed right-4 top-36 z-50 flex items-center gap-3 rounded-2xl border border-amber-300/35 bg-amber-400/15 px-4 py-3 text-sm font-semibold text-amber-100 shadow-2xl shadow-amber-400/20 backdrop-blur-xl">
          <BadgeCheck size={18} className="text-amber-200" />
          {warningToast}
        </div>
      ) : null}

      <section className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="employee-panel relative z-10 flex min-h-[220px] flex-col gap-4 rounded-[28px] p-5 sm:flex-row sm:items-center">
          <div className="relative grid size-28 shrink-0 place-items-center rounded-full bg-[conic-gradient(from_180deg,#DBEAFE,#2563EB,#93C5FD,#DBEAFE)] p-2 shadow-[0_24px_50px_rgba(37,99,235,0.22)] dark:bg-[conic-gradient(from_180deg,#22D3EE,#7C3AED,#EC4899,#22D3EE)] dark:shadow-[0_0_48px_rgba(168,85,247,0.32)]">
            <div className="absolute inset-3 rounded-full border border-white/70 dark:border-white/10" />
            <span className="absolute right-5 top-2 size-4 rounded-full bg-[#2563EB] shadow-[0_0_20px_rgba(37,99,235,0.75)] dark:bg-[#A855F7]" />
            <Image
              src="/avatar-rina.svg"
              alt="Foto profil Rina Pratiwi"
              width={112}
              height={112}
              className="size-20 rounded-full border-4 border-white/80 object-cover shadow-xl shadow-blue-950/12 dark:border-[#0D1832]"
            />
            <span className="absolute bottom-2 right-2 size-5 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.95)] dark:border-[#0A0F2C]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-3xl font-semibold text-[#07164D] dark:text-white">
                Rina Pratiwi
              </h2>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-[0_0_18px_rgba(52,211,153,0.12)] dark:border-emerald-300/35 dark:bg-emerald-300/10 dark:text-emerald-200">
                Aktif
              </span>
            </div>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
              Finance Officer - Divisi Keuangan
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-blue-100 bg-white/70 px-4 py-3 shadow-lg shadow-blue-950/5 dark:border-white/10 dark:bg-white/[0.06]">
                <p className="text-xs text-slate-500 dark:text-slate-400">Jam Digital</p>
                <p className="mt-1 text-lg font-semibold">
                  <DigitalClock />
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white/70 px-4 py-3 shadow-lg shadow-blue-950/5 dark:border-white/10 dark:bg-white/[0.06]">
                <p className="text-xs text-slate-500 dark:text-slate-400">Masuk Hari Ini</p>
                <p className="mt-1 font-mono text-lg font-semibold text-[#2563EB] dark:text-[#C4B5FD]">
                  08:00 WIB
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white/70 px-4 py-3 shadow-lg shadow-blue-950/5 dark:border-white/10 dark:bg-white/[0.06]">
                <p className="text-xs text-slate-500 dark:text-slate-400">Pulang Hari Ini</p>
                <p className="mt-1 font-mono text-lg font-semibold text-[#2563EB] dark:text-[#C4B5FD]">
                  17:00 WIB
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="employee-attendance-focus relative z-10 flex min-h-[220px] flex-col justify-between gap-3 rounded-[28px] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Status absensi hari ini
              </p>
              <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-emerald-700 dark:text-emerald-200">
                <BadgeCheck size={22} />
                Hadir
              </p>
            </div>
            <div className="grid size-14 place-items-center rounded-2xl border border-blue-200 bg-white/70 text-[#2563EB] shadow-lg shadow-blue-400/15 dark:border-violet-300/25 dark:bg-violet-300/10 dark:text-[#A855F7]">
              <ScanFace size={32} />
            </div>
          </div>
          <div className="grid gap-2 text-sm">
            {workSignals.map(([label, value, Icon]) => (
              <div
                key={label}
                className="flex min-h-10 items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white/70 px-3 py-2 shadow-sm shadow-blue-950/5 dark:border-white/10 dark:bg-white/[0.05]"
              >
                <span className="flex min-w-0 items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Icon size={16} className="shrink-0 text-[#2563EB] dark:text-[#22D3EE]" />
                  {label}
                </span>
                <span className="truncate text-right font-semibold text-slate-950 dark:text-white">
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <button
              type="button"
              onClick={() => openAttendance("masuk")}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#DBEAFE] to-[#2563EB] px-5 py-3 text-base font-semibold text-[#061A58] shadow-xl shadow-blue-500/24 hover:-translate-y-0.5 hover:shadow-blue-500/35 dark:from-[#14263F] dark:to-[#172554] dark:text-white dark:shadow-cyan-400/12"
            >
              <Camera size={19} />
              Absensi Masuk
            </button>
            <button
              type="button"
              onClick={() => openAttendance("keluar")}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#2563EB] px-5 py-3 text-base font-semibold text-white shadow-xl shadow-blue-600/24 hover:-translate-y-0.5 hover:shadow-blue-600/35 dark:from-[#7C3AED] dark:to-[#EC4899] dark:shadow-fuchsia-500/20"
            >
              <Fingerprint size={19} />
              Absensi Keluar
            </button>
          </div>
        </div>
      </section>

      <section className="mt-4 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="employee-card group flex min-h-[132px] flex-col justify-between rounded-[24px] p-4 hover:-translate-y-1"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="grid size-12 place-items-center rounded-2xl bg-blue-100 text-[#2563EB] shadow-lg shadow-blue-500/14 dark:bg-violet-400/20 dark:text-[#C4B5FD]">
                <card.icon size={24} />
              </div>
              <span className="size-2 rounded-full bg-[#22D3EE] shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
            </div>
            <div className="relative z-10">
              <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">{card.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${card.tone}`}>
                {card.value}
              </p>
              {card.progress ? (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#60A5FA] shadow-[0_0_16px_rgba(37,99,235,0.38)] dark:from-[#EC4899] dark:via-[#A855F7] dark:to-[#22D3EE]"
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-4 grid items-stretch gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <div className="employee-panel min-h-[280px] rounded-[28px] p-4">
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                Ringkasan Kehadiran Bulan Ini
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Juni 2026</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm shadow-emerald-500/10 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-200">
              <TrendingUp size={14} />
              95% score
            </div>
          </div>
          <div className="relative z-10 mt-4 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-[24px] border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-3 shadow-inner shadow-white/80 dark:border-cyan-300/20 dark:bg-[#0A0F2C]/50 dark:bg-none dark:shadow-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Attendance Performance
              </p>
              <div className="mt-3 grid place-items-center">
                <div className="relative grid size-24 place-items-center rounded-full bg-[conic-gradient(#2563EB_0_342deg,#DBEAFE_342deg_360deg)] p-2 shadow-[0_0_34px_rgba(37,99,235,0.18)] dark:bg-[conic-gradient(#22D3EE_0_342deg,rgba(255,255,255,0.1)_342deg_360deg)]">
                  <div className="grid size-full place-items-center rounded-full bg-white dark:bg-[#0D1832]">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-slate-950 dark:text-white">
                        95%
                      </p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Kehadiran
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid content-center gap-2.5">
              {monthStats.map(([label, value, percent, gradient]) => (
                <div
                  key={label}
                  className="grid grid-cols-[82px_1fr_32px] items-center gap-3 text-sm"
                >
                  <span className="text-slate-600 dark:text-slate-300">{label}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-blue-100/70 dark:bg-white/10">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                      style={{ width: `${Math.max(percent, value ? 8 : 0)}%` }}
                    />
                  </div>
                  <span className="text-right font-mono text-slate-700 dark:text-slate-200">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="employee-card min-h-[280px] overflow-hidden rounded-[28px]">
            <div className="employee-map-surface relative h-36">
              <div className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-blue-300/55 bg-blue-500/10 text-[#2563EB] shadow-[0_0_38px_rgba(37,99,235,0.24)] dark:border-emerald-300/40 dark:bg-emerald-300/10 dark:text-emerald-200 dark:shadow-[0_0_36px_rgba(52,211,153,0.28)]">
                <MapPinned size={28} />
              </div>
            </div>
            <div className="relative z-10 p-4">
              <p className="font-semibold text-slate-950 dark:text-white">
                Lokasi dan Geofencing
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Kantor Pusat Jakarta - dalam radius 100 meter
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                GPS valid
              </div>
            </div>
        </div>

          <div className="employee-card min-h-[280px] rounded-[28px] p-4">
            <p className="relative z-10 text-sm text-slate-500 dark:text-slate-400">Real-time Attendance Status</p>
            <p className="relative z-10 mt-3 text-base font-semibold text-slate-950 dark:text-white">{lastStatus}</p>
            <div className="employee-face-visual relative z-10 mt-4 flex items-center gap-3 rounded-2xl border border-blue-100 p-3 dark:border-emerald-300/20">
              <ScanFace className="text-emerald-600 dark:text-emerald-300" size={28} />
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-100">
                  Face Verification
                </p>
                <p className="text-sm text-emerald-700/80 dark:text-emerald-200/75">
                  Verifikasi wajah berhasil
                </p>
              </div>
            </div>
            <div className="relative z-10 mt-3 grid gap-2">
              {notices.map(([label, text]) => (
                <div
                  key={text}
                  className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-white/64 px-3 py-2 shadow-sm shadow-blue-950/5 dark:border-white/10 dark:bg-[#050816]/55"
                >
                  <BellRing
                    size={17}
                    className="mt-0.5 shrink-0 text-[#0891B2] dark:text-[#22D3EE]"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
                      {label}
                    </p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </section>

      {attendanceModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/75 p-4 backdrop-blur-xl">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-cyan-300/25 bg-[#0A0F2C]/95 shadow-2xl shadow-cyan-400/20">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-sm text-slate-400">Mode absensi</p>
                <h3 className="text-xl font-semibold text-white">
                  {attendanceModal === "masuk"
                    ? "Absensi Masuk"
                    : "Absensi Keluar"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeAttendanceModal}
                className="grid size-10 place-items-center rounded-2xl border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Tutup modal absensi"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <canvas ref={canvasRef} className="hidden" />
              <div className="relative overflow-hidden rounded-[24px] border border-cyan-300/30 bg-[#11183A] shadow-[0_0_34px_rgba(0,240,255,0.13)]">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="aspect-video w-full bg-[#11183A] object-cover"
                />
                {!cameraError ? (
                  <div
                    className={[
                      "absolute left-1/2 top-1/2 grid size-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-[#0A0F2C]/30 backdrop-blur-[1px]",
                      faceDetected
                        ? "border-emerald-300/70 text-emerald-200 shadow-[0_0_38px_rgba(52,211,153,0.32)]"
                        : "border-amber-300/70 text-amber-200 shadow-[0_0_38px_rgba(251,191,36,0.18)]",
                    ].join(" ")}
                  >
                    {faceDetected ? <CheckCircle2 size={58} /> : <ScanFace size={58} />}
                  </div>
                ) : null}
                <div className="absolute bottom-4 left-4 rounded-2xl bg-black/35 px-4 py-3 text-xs leading-5 text-slate-200 backdrop-blur-md">
                  <p>{watermark}</p>
                  <p>Rina Pratiwi</p>
                  <p>Kantor Pusat Jakarta</p>
                </div>
              </div>
              {cameraError ? (
                <div className="mt-4 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100">
                  {cameraError}
                </div>
              ) : null}
              {modalNotice ? (
                <div
                  className={[
                    "mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold",
                    faceDetected
                      ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                      : "border-amber-300/25 bg-amber-400/10 text-amber-100",
                  ].join(" ")}
                >
                  {modalNotice}
                </div>
              ) : null}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <MapPinned size={18} className="text-emerald-300" />
                  GPS: Kantor Pusat Jakarta, radius 82 meter
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualFace(false)}
                    className="min-h-11 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 text-sm font-semibold text-amber-100 hover:border-amber-200"
                  >
                    Tidak terlihat
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualFace(true)}
                    className="min-h-11 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 text-sm font-semibold text-emerald-100 hover:border-emerald-200"
                  >
                    Terlihat
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={saveAttendance}
                disabled={saving || Boolean(cameraError)}
                className={[
                  "mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 font-semibold shadow-lg hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60",
                  attendanceModal === "masuk"
                    ? "bg-gradient-to-r from-emerald-400 to-[#00F0FF] text-[#071128] shadow-cyan-400/20"
                    : "bg-gradient-to-r from-red-500 to-orange-400 text-white shadow-orange-500/20",
                ].join(" ")}
              >
                {saving ? <span className="employee-spinner" /> : <Camera size={18} />}
                {saving
                  ? "Menyimpan..."
                  : attendanceModal === "masuk"
                    ? "Simpan Absensi Masuk"
                    : "Simpan Absensi Keluar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </EmployeeShell>
  );
}
