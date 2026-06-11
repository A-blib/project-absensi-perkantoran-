"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CalendarX,
  Camera,
  CheckCircle2,
  Clock3,
  Fingerprint,
  LogIn,
  LogOut,
  MapPinned,
  ScanFace,
  ShieldCheck,
  X,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { saveEmployeeAttendanceByType } from "@/lib/browser/employee-attendance-store";

const summaryCards = [
  {
    label: "Today's Status",
    value: "Hadir",
    note: "Tepat waktu (07:55 WIB)",
    icon: CheckCircle2,
    tone: "emerald",
  },
  {
    label: "Check-In",
    value: "08:00",
    note: "Senin, 24 Mei 2026",
    icon: LogIn,
    tone: "primary",
  },
  {
    label: "Check-Out",
    value: "17:00",
    note: "Estimasi jam pulang",
    icon: LogOut,
    tone: "primary",
  },
  {
    label: "Total Izin",
    value: "2 Hari",
    note: "Periode bulan Juni",
    icon: CalendarX,
    tone: "primary",
  },
];

const week = [
  ["SEN", "08:00", "17:00", "REGULAR"],
  ["SEL", "08:00", "17:00", "HARI INI"],
  ["RAB", "08:00", "17:00", "WFH"],
  ["KAM", "08:00", "17:00", "REGULAR"],
  ["JUM", "08:00", "16:30", "SHORT"],
];

const notifications = [
  ["Reminder Absensi", "Jangan lupa absensi keluar sebelum meninggalkan kantor.", "15 menit lalu"],
  ["Jadwal Kerja", "Briefing finance pukul 09:30 di ruang meeting lantai 3.", "Tadi pagi"],
  ["Pengajuan Izin", "Cuti tahunan Juni masih menunggu persetujuan HR.", "Kemarin"],
];

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

export default function EmployeeHomePage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [clock, setClock] = useState("--:--:--");
  const [lastStatus, setLastStatus] = useState("Face verification ready");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [pendingType, setPendingType] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const update = () =>
      setClock(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jakarta",
        }),
      );
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function openAttendanceCamera(type) {
    setPendingType(type);
    setCameraError("");
    setFaceDetected(false);
    setCameraOpen(true);
    setLastStatus(
      type === "masuk"
        ? "Membuka kamera untuk absensi masuk"
        : "Membuka kamera untuk absensi keluar",
    );

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

      setLastStatus("Scanning face...");
      setTimeout(() => setFaceDetected(true), 900);
    } catch {
      setCameraError("Kamera tidak bisa dibuka. Izinkan akses kamera browser.");
      setLastStatus("Camera unavailable");
    }
  }

  function closeAttendanceCamera() {
    stopCamera();
    setCameraOpen(false);
    setPendingType(null);
    setSaving(false);
  }

  function saveAttendance(type) {
    const savedAt = getStamp();
    const time = savedAt.split(", ")[1] || "--:--:--";
    saveEmployeeAttendanceByType(type, {
      id: `attendance-${Date.now()}`,
      photo: null,
      savedAt,
      date: savedAt.split(",")[0],
      clockIn: type === "masuk" ? time : "08:00:22",
      clockOut: type === "keluar" ? time : "--:--:--",
      status: "Hadir",
      location: "Kantor Pusat Jakarta",
    });
    setLastStatus(
      type === "masuk"
        ? `Absensi masuk tercatat pukul ${time} WIB`
        : `Absensi keluar tercatat pukul ${time} WIB`,
    );
  }

  function confirmAttendance() {
    if (!pendingType || !faceDetected) return;

    setSaving(true);
    setLastStatus("Menyimpan absensi...");
    setTimeout(() => {
      saveAttendance(pendingType);
      closeAttendanceCamera();
    }, 700);
  }

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <EmployeeShell>
      <div className="mx-auto max-w-[1440px] space-y-8">
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#C2C6D6]/80">
              Attendance Summary
            </h2>
            <span className="text-sm font-medium text-[#3B82F6]">
              Status: Active
            </span>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="glass-panel group flex min-h-[170px] cursor-default flex-col justify-between rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#C2C6D6]/60">
                      {card.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#D4E4FA]">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={[
                      "grid size-12 place-items-center rounded-2xl border",
                      card.tone === "emerald"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[#3B82F6]",
                    ].join(" ")}
                  >
                    <card.icon size={28} />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#C2C6D6]">
                  {card.tone === "emerald" ? (
                    <span className="status-pulse size-2 rounded-full bg-emerald-500" />
                  ) : null}
                  {card.note}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="space-y-8 xl:col-span-2">
            <section className="glass-panel relative overflow-hidden rounded-2xl p-8">
              <div className="absolute right-0 top-0 -mr-32 -mt-32 size-80 rounded-full bg-[#3B82F6]/5 blur-[100px]" />
              <div className="relative z-10 mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h3 className="text-xl font-bold text-[#D4E4FA]">
                    Jadwal Kerja Mingguan
                  </h3>
                  <p className="mt-1 text-sm text-[#C2C6D6]">
                    Minggu ke-2 - Juni 2026
                  </p>
                </div>
                <a
                  href="/employee/jadwal"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#3B82F6] px-6 text-sm font-bold text-white shadow-lg shadow-[#3B82F6]/20 transition-all hover:brightness-110 active:scale-95"
                >
                  Lihat Detail
                </a>
              </div>
              <div className="relative z-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {week.map(([day, start, end, label]) => {
                  const today = label === "HARI INI";
                  return (
                    <div
                      key={day}
                      className={[
                        "flex flex-col items-center gap-4 rounded-2xl border p-4 transition-all",
                        today
                          ? "scale-[1.04] border-[#3B82F6]/30 bg-[#3B82F6]/10 shadow-2xl shadow-[#3B82F6]/10"
                          : "border-white/5 bg-white/[0.05]",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "text-[11px] font-bold uppercase tracking-widest",
                          today ? "text-[#3B82F6]" : "text-[#C2C6D6]",
                        ].join(" ")}
                      >
                        {day}
                      </span>
                      <p className="text-2xl font-bold text-[#D4E4FA]">
                        {start}
                      </p>
                      <p className="text-xs text-[#C2C6D6]">{end}</p>
                      <div
                        className={[
                          "rounded-lg px-3 py-1 text-[10px] font-bold",
                          today
                            ? "bg-[#3B82F6] text-white"
                            : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
                        ].join(" ")}
                      >
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-8 lg:grid-cols-2">
              <div className="glass-panel rounded-2xl p-8">
                <h3 className="mb-6 text-xl font-bold text-[#D4E4FA]">
                  Face Recognition
                </h3>
                <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl border border-[#24344D] bg-[#0B1220]">
                  <div className="scanning-line absolute left-0 right-0" />
                  <div className="relative grid size-36 place-items-center rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#3B82F6]">
                    <ScanFace size={70} />
                    <span className="corner-tl absolute" />
                    <span className="corner-tr absolute" />
                    <span className="corner-bl absolute" />
                    <span className="corner-br absolute" />
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => openAttendanceCamera("masuk")}
                    className="group flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl border border-[#24344D] bg-[#132238] px-3 text-sm font-bold text-[#D4E4FA] transition-all hover:-translate-y-0.5 hover:border-[#3B82F6]/60 hover:bg-white/[0.05] active:scale-[0.98]"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#0B1220] text-[#ADC6FF] transition group-hover:bg-[#3B82F6] group-hover:text-white">
                      <Fingerprint size={16} />
                    </span>
                    <span className="min-w-0 leading-tight">Absensi Masuk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAttendanceCamera("keluar")}
                    className="group flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-3 text-sm font-bold text-white shadow-lg shadow-[#3B82F6]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/12 text-white">
                      <ShieldCheck size={16} />
                    </span>
                    <span className="min-w-0 leading-tight">Absensi Keluar</span>
                  </button>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-8">
                <h3 className="mb-6 text-xl font-bold text-[#D4E4FA]">
                  Lokasi dan Status
                </h3>
                <div className="rounded-2xl border border-[#24344D] bg-white/[0.04] p-5">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <MapPinned size={24} />
                    <span className="font-bold">GPS valid</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#C2C6D6]">
                    Kantor Pusat Jakarta - dalam radius 100 meter. Sistem
                    lokasi aktif dan siap memvalidasi presensi.
                  </p>
                </div>
                <div className="mt-5 rounded-2xl border border-[#24344D] bg-white/[0.04] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#C2C6D6]/70">
                    Real-time Attendance Status
                  </p>
                  <p className="mt-3 text-lg font-bold text-[#D4E4FA]">
                    {lastStatus}
                  </p>
                  <p className="mt-4 font-mono text-3xl font-bold text-[#3B82F6]">
                    {clock}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="glass-panel rounded-2xl p-6">
              <h3 className="mb-5 text-lg font-bold text-[#D4E4FA]">
                Notification Panel
              </h3>
              <div className="space-y-4">
                {notifications.map(([title, desc, time]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-[#24344D] bg-white/[0.04] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold text-[#D4E4FA]">{title}</p>
                      <span className="shrink-0 text-[11px] text-[#C2C6D6]">
                        {time}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#C2C6D6]">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-2xl p-6">
              <h3 className="mb-5 text-lg font-bold text-[#D4E4FA]">
                Monthly Performance
              </h3>
              <div className="grid place-items-center py-4">
                <div className="grid size-40 place-items-center rounded-full border-[10px] border-[#3B82F6]/20 border-t-[#3B82F6]">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-[#D4E4FA]">95%</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#C2C6D6]">
                      Kehadiran
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {cameraOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#050B14]/80 p-4 backdrop-blur-xl">
          <div className="glass-panel w-full max-w-3xl overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-[#24344D] px-6 py-4">
              <div>
                <p className="text-sm text-[#8B9DB5]">
                  {pendingType === "masuk" ? "Absensi Masuk" : "Absensi Keluar"}
                </p>
                <h3 className="text-xl font-bold text-[#D4E4FA]">
                  Verifikasi Kamera
                </h3>
              </div>
              <button
                type="button"
                onClick={closeAttendanceCamera}
                className="grid size-11 place-items-center rounded-2xl border border-[#24344D] text-[#C2C6D6] transition hover:bg-[#24344D]"
                aria-label="Tutup kamera"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="relative overflow-hidden rounded-3xl border border-[#24344D] bg-[#0B1220]">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="aspect-video w-full bg-[#0B1220] object-cover"
                />
                {!cameraError ? (
                  <div className="absolute inset-0">
                    <div className="scanning-line absolute left-0 right-0" />
                    <span className="corner-tl absolute" />
                    <span className="corner-tr absolute" />
                    <span className="corner-bl absolute" />
                    <span className="corner-br absolute" />
                  </div>
                ) : null}
              </div>

              {cameraError ? (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                  <AlertTriangle size={18} />
                  {cameraError}
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 rounded-2xl border border-[#24344D] bg-[#0B1220] px-4 py-3 text-sm font-semibold text-[#D4E4FA]">
                    {faceDetected ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <Clock3 size={20} className="text-[#3B82F6]" />
                    )}
                    {faceDetected ? "Wajah terverifikasi" : "Memindai wajah..."}
                  </div>
                  <button
                    type="button"
                    onClick={confirmAttendance}
                    disabled={!faceDetected || saving}
                    className="flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#3B82F6] px-6 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-[#60A5FA] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {saving ? <span className="employee-spinner" /> : <Camera size={18} />}
                    {saving ? "Menyimpan..." : "Simpan Absensi"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </EmployeeShell>
  );
}
