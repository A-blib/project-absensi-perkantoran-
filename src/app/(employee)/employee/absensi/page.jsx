"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  MapPin,
  Radio,
  ScanFace,
  ShieldCheck,
  X,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import {
  readEmployeeAttendanceRecords,
  saveEmployeeAttendanceRecord,
} from "@/lib/browser/employee-attendance-store";

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

export default function EmployeeAttendancePage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const autoDetectTimerRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [warning, setWarning] = useState("");
  const [stamp, setStamp] = useState(getStamp());
  const [lastStatus, setLastStatus] = useState("Ready for verification");
  const [savedAttendance, setSavedAttendance] = useState(null);

  function stopCamera() {
    if (autoDetectTimerRef.current) {
      clearTimeout(autoDetectTimerRef.current);
      autoDetectTimerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function openCamera() {
    setStamp(getStamp());
    setCameraError("");
    setFaceDetected(false);
    setWarning("");
    setLastStatus("Opening camera");
    setIsCameraOpen(true);

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

      setLastStatus("Scanning face");
      autoDetectTimerRef.current = setTimeout(() => {
        setFaceDetected(true);
        setLastStatus("Face verified");
      }, 1200);
    } catch {
      setCameraError("Kamera tidak bisa dibuka. Izinkan akses kamera browser.");
      setLastStatus("Camera unavailable");
    }
  }

  function closeCamera() {
    stopCamera();
    setIsCameraOpen(false);
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(11, 18, 32, 0.78)";
    context.fillRect(20, canvas.height - 112, 330, 88);
    context.fillStyle = "#d4e4fa";
    context.font = "600 18px Arial";
    context.fillText(stamp, 38, canvas.height - 78);
    context.fillText("Rina Pratiwi", 38, canvas.height - 52);
    context.fillText("Kantor Pusat Jakarta", 38, canvas.height - 26);

    return canvas.toDataURL("image/jpeg", 0.88);
  }

  function handleCapture() {
    if (!faceDetected) {
      setWarning("Wajah belum terdeteksi. Posisikan wajah di tengah frame.");
      return;
    }

    setSaving(true);
    setLastStatus("Saving attendance");
    const capturedPhoto = captureFrame();

    setTimeout(() => {
      const savedAt = getStamp();
      const record = {
        id: `attendance-${Date.now()}`,
        photo: capturedPhoto,
        savedAt,
        date: savedAt.split(",")[0],
        clockIn: savedAt.split(", ")[1] || "--:--:--",
        clockOut: "--:--:--",
        status: "Hadir",
        location: "Kantor Pusat Jakarta",
      };

      saveEmployeeAttendanceRecord(record);
      playSuccessSound();
      setSavedAttendance(record);
      setNotice("Absensi berhasil disimpan");
      setLastStatus(`Saved at ${savedAt}`);
      setSaving(false);
      closeCamera();
    }, 800);
  }

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      const [latestRecord] = readEmployeeAttendanceRecords();
      if (latestRecord) {
        setSavedAttendance(latestRecord);
        setLastStatus(`Saved at ${latestRecord.savedAt}`);
      }
    }, 0);

    return () => {
      clearTimeout(loadTimer);
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!notice && !warning) return undefined;
    const timer = setTimeout(() => {
      setNotice("");
      setWarning("");
    }, 3200);
    return () => clearTimeout(timer);
  }, [notice, warning]);

  return (
    <EmployeeShell>
      {notice || warning ? (
        <div className="fixed right-4 top-24 z-50 rounded-2xl border border-[#24344D] bg-[#132238]/95 px-4 py-3 text-sm font-semibold text-[#d4e4fa] shadow-2xl backdrop-blur-xl">
          {notice || warning}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="glass-panel rounded-3xl p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[#8B9DB5]">Face recognition attendance</p>
              <h2 className="mt-1 text-2xl font-bold text-[#d4e4fa]">
                Verifikasi Kehadiran
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#24344D] bg-[#0B1220] px-4 py-2 text-sm text-[#c2c6d6]">
              <Radio size={16} className="text-[#3b82f6]" />
              Kantor Pusat Jakarta
            </span>
          </div>

          <div className="relative grid min-h-[420px] place-items-center overflow-hidden rounded-3xl border border-[#24344D] bg-[#0B1220]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,.15),transparent_40%),linear-gradient(90deg,rgba(59,130,246,.08)_1px,transparent_1px),linear-gradient(rgba(59,130,246,.08)_1px,transparent_1px)] bg-[size:auto,48px_48px,48px_48px]" />
            <div className="absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-60" />
            <div className="relative grid size-56 place-items-center rounded-full border border-[#3b82f6]/35 bg-[#132238] shadow-[0_0_80px_rgba(59,130,246,.22)]">
              <div className="absolute inset-4 rounded-full border border-dashed border-[#3b82f6]/30" />
              <ScanFace size={108} className="text-[#3b82f6]" />
            </div>
            <div className="absolute bottom-6 left-6 rounded-2xl border border-[#24344D] bg-[#132238]/90 px-4 py-3 text-sm text-[#c2c6d6] backdrop-blur-xl">
              <p>{stamp}</p>
              <p className="font-semibold text-[#d4e4fa]">Rina Pratiwi</p>
              <p>Finance Officer</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={openCamera}
              className="flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#3b82f6] px-5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-[#60a5fa]"
            >
              <Camera size={20} />
              Mulai Verifikasi
            </button>
            <div className="flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-[#24344D] bg-[#0B1220] px-5 text-sm font-semibold text-[#c2c6d6]">
              <ShieldCheck size={20} className="text-emerald-400" />
              GPS validation online
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-sm text-[#8B9DB5]">Verification status</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="font-semibold text-[#d4e4fa]">{lastStatus}</p>
                <p className="text-sm text-[#8B9DB5]">Realtime biometric check</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <h3 className="font-semibold text-[#d4e4fa]">Attendance Record</h3>
            {savedAttendance ? (
              <div className="mt-4 space-y-4">
                {savedAttendance.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={savedAttendance.photo}
                    alt="Foto absensi terakhir"
                    className="aspect-video w-full rounded-2xl border border-[#24344D] object-cover"
                  />
                ) : null}
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-2xl bg-[#0B1220] px-4 py-3">
                    <span className="text-[#8B9DB5]">Status</span>
                    <span className="font-semibold text-emerald-400">
                      {savedAttendance.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-[#0B1220] px-4 py-3">
                    <span className="text-[#8B9DB5]">Clock In</span>
                    <span className="font-semibold text-[#d4e4fa]">
                      {savedAttendance.clockIn}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[#8B9DB5]">
                Belum ada absensi tersimpan untuk sesi ini.
              </p>
            )}
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <h3 className="font-semibold text-[#d4e4fa]">Office Radius</h3>
            <div className="mt-4 flex items-center gap-3 text-sm text-[#c2c6d6]">
              <MapPin size={20} className="text-[#3b82f6]" />
              Dalam radius 100 meter
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#0B1220]">
              <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#3b82f6] to-emerald-400" />
            </div>
          </div>
        </aside>
      </div>

      {isCameraOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#050B14]/80 p-4 backdrop-blur-xl">
          <div className="glass-panel w-full max-w-4xl overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-[#24344D] px-6 py-4">
              <div>
                <p className="text-sm text-[#8B9DB5]">Camera verification</p>
                <h3 className="text-xl font-bold text-[#d4e4fa]">Capture Absensi</h3>
              </div>
              <button
                type="button"
                onClick={closeCamera}
                className="grid size-11 place-items-center rounded-2xl border border-[#24344D] text-[#c2c6d6] transition hover:bg-[#24344D]"
                aria-label="Tutup kamera"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <canvas ref={canvasRef} className="hidden" />
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
                <div className="absolute bottom-5 left-5 rounded-2xl border border-[#24344D] bg-[#132238]/85 px-4 py-3 text-sm text-[#c2c6d6] backdrop-blur-xl">
                  <p>{stamp}</p>
                  <p className="font-semibold text-[#d4e4fa]">Rina Pratiwi</p>
                  <p>Kantor Pusat Jakarta</p>
                </div>
              </div>

              {cameraError ? (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                  {cameraError}
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 rounded-2xl border border-[#24344D] bg-[#0B1220] px-4 py-3 text-sm font-semibold text-[#d4e4fa]">
                    {faceDetected ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <Clock3 size={20} className="text-[#3b82f6]" />
                    )}
                    {faceDetected ? "Face verified" : "Scanning face..."}
                  </div>
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={saving}
                    className="flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#3b82f6] px-6 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-[#60a5fa] disabled:pointer-events-none disabled:opacity-60"
                  >
                    {saving ? <span className="employee-spinner" /> : <Camera size={18} />}
                    {saving ? "Menyimpan..." : "Simpan Absensi"}
                  </button>
                </div>
              )}

              {warning ? (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">
                  <AlertTriangle size={18} />
                  {warning}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </EmployeeShell>
  );
}
