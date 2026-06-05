"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Activity,
  BadgeCheck,
  CalendarCheck2,
  Camera,
  CheckCircle2,
  Clock3,
  Fingerprint,
  Gauge,
  MapPinned,
  ScanFace,
  TimerReset,
  X,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { saveEmployeeAttendanceByType } from "@/lib/browser/employee-attendance-store";

const summaryCards = [
  {
    label: "Status Hari Ini",
    value: "Hadir",
    tone: "text-emerald-300",
    icon: CalendarCheck2,
  },
  {
    label: "Jam Masuk",
    value: "08:00 WIB",
    tone: "text-[#00F0FF]",
    icon: Clock3,
  },
  {
    label: "Jam Pulang",
    value: "17:00 WIB",
    tone: "text-[#00F0FF]",
    icon: TimerReset,
  },
  {
    label: "Persentase Kehadiran",
    value: "95%",
    tone: "text-violet-200",
    icon: Gauge,
    progress: 95,
  },
];

const monthStats = [
  ["Hadir", 18, "from-emerald-400 to-cyan-300"],
  ["Terlambat", 2, "from-amber-300 to-orange-400"],
  ["Izin", 1, "from-sky-300 to-violet-400"],
  ["Sakit", 1, "from-rose-300 to-red-400"],
  ["Cuti", 0, "from-slate-300 to-slate-500"],
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
    <span className="font-mono text-[#00F0FF]">
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

      <section className="grid gap-5 rounded-[28px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-violet-950/20 backdrop-blur-2xl lg:grid-cols-[1.25fr_0.75fr] lg:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative size-28 shrink-0 rounded-full bg-gradient-to-br from-[#00F0FF] via-[#6C3CE8] to-[#E2E8F0] p-1 shadow-[0_0_38px_rgba(0,240,255,0.22)]">
            <Image
              src="/avatar-rina.svg"
              alt="Foto profil Rina Pratiwi"
              width={112}
              height={112}
              className="size-full rounded-full object-cover"
            />
            <span className="absolute bottom-2 right-2 size-5 rounded-full border-2 border-[#0A0F2C] bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.95)]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Rina Pratiwi
              </h2>
              <span className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.16)]">
                Aktif
              </span>
            </div>
            <p className="mt-2 text-slate-300">Finance Officer - Divisi Keuangan</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-cyan-300/15 bg-[#0A0F2C]/45 px-4 py-3">
                <p className="text-xs text-slate-400">Jam Digital</p>
                <p className="mt-1 text-lg font-semibold">
                  <DigitalClock />
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-300/15 bg-[#0A0F2C]/45 px-4 py-3">
                <p className="text-xs text-slate-400">Masuk Hari Ini</p>
                <p className="mt-1 font-mono text-lg font-semibold text-[#00F0FF]">
                  08:00 WIB
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-300/15 bg-[#0A0F2C]/45 px-4 py-3">
                <p className="text-xs text-slate-400">Pulang Hari Ini</p>
                <p className="mt-1 font-mono text-lg font-semibold text-[#00F0FF]">
                  17:00 WIB
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-[24px] border border-white/10 bg-[#0A0F2C]/50 p-4 shadow-inner shadow-white/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Status absensi hari ini</p>
              <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-emerald-200">
                <BadgeCheck size={22} />
                Hadir
              </p>
            </div>
            <ScanFace className="text-[#00F0FF]" size={34} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <button
              type="button"
              onClick={() => openAttendance("masuk")}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-[#00F0FF] px-5 py-3 font-semibold text-[#071128] shadow-lg shadow-cyan-400/20 hover:-translate-y-0.5 hover:shadow-cyan-300/40"
            >
              <Camera size={19} />
              Absensi Masuk
            </button>
            <button
              type="button"
              onClick={() => openAttendance("keluar")}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-orange-400 px-5 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 hover:shadow-orange-400/40"
            >
              <Fingerprint size={19} />
              Absensi Keluar
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="group rounded-[24px] border border-white/10 bg-white/[0.07] p-5 shadow-xl shadow-black/10 backdrop-blur-2xl hover:-translate-y-1 hover:border-cyan-300/45 hover:shadow-cyan-400/10"
          >
            <div className="flex items-center justify-between">
              <card.icon className={card.tone} size={25} />
              <span className="size-2 rounded-full bg-[#00F0FF] shadow-[0_0_16px_rgba(0,240,255,0.9)]" />
            </div>
            <p className="mt-5 text-sm text-slate-400">{card.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${card.tone}`}>
              {card.value}
            </p>
            {card.progress ? (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00F0FF] to-[#6C3CE8] shadow-[0_0_16px_rgba(0,240,255,0.45)]"
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-5 shadow-xl shadow-black/10 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Ringkasan Kehadiran Bulan Ini
              </h3>
              <p className="text-sm text-slate-400">Juni 2026</p>
            </div>
            <Activity className="text-[#00F0FF]" size={24} />
          </div>
          <div className="mt-5 grid gap-3">
            {monthStats.map(([label, value, gradient]) => (
              <div
                key={label}
                className="grid grid-cols-[96px_1fr_40px] items-center gap-3 text-sm"
              >
                <span className="text-slate-300">{label}</span>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                    style={{ width: `${Math.max(value * 5, 8)}%` }}
                  />
                </div>
                <span className="text-right font-mono text-slate-200">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.07] shadow-xl shadow-black/10 backdrop-blur-2xl">
            <div className="relative h-44 bg-[#11183A]">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,240,255,0.13)_1px,transparent_1px),linear-gradient(rgba(108,60,232,0.14)_1px,transparent_1px)] bg-[size:28px_28px]" />
              <div className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-emerald-300/40 bg-emerald-300/10 text-emerald-200 shadow-[0_0_36px_rgba(52,211,153,0.28)]">
                <MapPinned size={28} />
              </div>
            </div>
            <div className="p-5">
              <p className="font-semibold text-white">Lokasi dan Geofencing</p>
              <p className="mt-2 text-sm text-slate-400">
                Kantor Pusat Jakarta - dalam radius 100 meter
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                GPS valid
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-5 shadow-xl shadow-black/10 backdrop-blur-2xl">
            <p className="text-sm text-slate-400">Real-time Attendance Status</p>
            <p className="mt-3 text-base font-semibold text-white">{lastStatus}</p>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
              <ScanFace className="text-emerald-300" size={28} />
              <div>
                <p className="font-semibold text-emerald-100">
                  Face Verification
                </p>
                <p className="text-sm text-emerald-200/75">
                  Verifikasi wajah berhasil
                </p>
              </div>
            </div>
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
