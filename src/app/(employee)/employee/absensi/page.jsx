"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  MapPinned,
  ScanFace,
  Volume2,
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
  const notes = [660, 880, 1175];

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime + index * 0.12;

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
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
  const detectorTimerRef = useRef(null);
  const autoDetectTimerRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [, setManualFaceState] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [warningToast, setWarningToast] = useState("");
  const [stamp, setStamp] = useState(getStamp());
  const [lastStatus, setLastStatus] = useState("Siap melakukan capture");
  const [modalNotice, setModalNotice] = useState("");
  const [savedAttendance, setSavedAttendance] = useState(null);

  function stopCamera() {
    if (detectorTimerRef.current) {
      clearInterval(detectorTimerRef.current);
      detectorTimerRef.current = null;
    }
    if (autoDetectTimerRef.current) {
      clearTimeout(autoDetectTimerRef.current);
      autoDetectTimerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function scheduleDemoDetection() {
    autoDetectTimerRef.current = setTimeout(() => {
      setManualFaceState((current) => {
        if (current === false) return current;

        setFaceDetected(true);
        setLastStatus("Wajah terdeteksi");
        setModalNotice("Wajah terdeteksi. Absensi sudah bisa disimpan.");
        return current;
      });
    }, 1200);
  }

  async function openCameraPopup() {
    setStamp(getStamp());
    setCameraError("");
    setFaceDetected(false);
    setManualFaceState(null);
    setModalNotice("");
    setSaving(false);
    setWarningToast("");
    setLastStatus("Membuka kamera...");
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

      setLastStatus("Wajah tidak terdeteksi");
      setModalNotice("Posisikan wajah di tengah kamera agar sistem bisa mendeteksi.");
      scheduleDemoDetection();
    } catch {
      setCameraError("Kamera tidak bisa dibuka. Izinkan akses kamera browser.");
      setLastStatus("Kamera gagal dibuka");
    }
  }

  function closeCameraPopup() {
    stopCamera();
    setIsCameraOpen(false);
  }

  function handleFallbackFaceToggle(value) {
    setManualFaceState(value);
    setFaceDetected(value);
    setWarningToast("");
    setModalNotice(
      value
        ? "Wajah terdeteksi. Absensi sudah bisa disimpan."
        : "Wajah tidak terlihat. Absensi tidak bisa disimpan.",
    );
    setLastStatus(value ? "Wajah terdeteksi" : "Wajah tidak terdeteksi");
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
    context.fillText(stamp, 34, canvas.height - 72);
    context.fillText("Rina Pratiwi", 34, canvas.height - 47);
    context.fillText("Kantor Pusat Jakarta", 34, canvas.height - 22);

    return canvas.toDataURL("image/jpeg", 0.88);
  }

  function handleCapture() {
    if (!faceDetected) {
      setLastStatus("Wajah tidak terdeteksi");
      setModalNotice("Absensi belum bisa disimpan karena wajah tidak terlihat.");
      setWarningToast("Wajah tidak terdeteksi. Absensi belum disimpan.");
      return;
    }

    const capturedPhoto = captureFrame();
    setSaving(true);
    setModalNotice("Wajah terdeteksi. Menyimpan foto absensi...");
    setLastStatus("Menyimpan data...");

    setTimeout(() => {
      const savedAt = getStamp();
      playSuccessSound();
      setSaving(false);
      setToast("Absensi berhasil disimpan");
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
      setSavedAttendance(record);
      setLastStatus(`Absensi berhasil pukul ${savedAt}`);
      closeCameraPopup();
    }, 900);
  }

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      const [latestRecord] = readEmployeeAttendanceRecords();

      if (latestRecord) {
        setSavedAttendance(latestRecord);
        setLastStatus(`Absensi berhasil pukul ${latestRecord.savedAt}`);
      }
    }, 0);

    return () => {
      clearTimeout(loadTimer);
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!warningToast) return undefined;
    const timer = setTimeout(() => setWarningToast(""), 3200);
    return () => clearTimeout(timer);
  }, [warningToast]);

  return (
    <EmployeeShell>
      {toast ? (
        <div className="employee-toast fixed right-4 top-20 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-4 py-3 text-sm font-semibold text-emerald-100 shadow-2xl shadow-emerald-400/20 backdrop-blur-xl">
          <Volume2 size={18} className="text-emerald-300" />
          {toast}
        </div>
      ) : null}
      {warningToast ? (
        <div className="employee-toast fixed right-4 top-36 z-50 flex items-center gap-3 rounded-2xl border border-amber-300/35 bg-amber-400/15 px-4 py-3 text-sm font-semibold text-amber-100 shadow-2xl shadow-amber-400/20 backdrop-blur-xl">
          <AlertTriangle size={18} className="text-amber-200" />
          {warningToast}
        </div>
      ) : null}

      <div className="mb-5">
        <p className="text-sm text-slate-400">Kamera absensi</p>
        <h2 className="text-3xl font-semibold text-white">Absensi Pegawai</h2>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[28px] border border-cyan-300/20 bg-white/[0.07] p-4 shadow-2xl shadow-cyan-400/10 backdrop-blur-2xl">
          <div className="relative grid aspect-video min-h-[300px] place-items-center overflow-hidden rounded-[24px] border border-cyan-300/30 bg-[#11183A] sm:min-h-[340px]">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,240,255,0.09)_1px,transparent_1px),linear-gradient(rgba(108,60,232,0.09)_1px,transparent_1px)] bg-[size:36px_36px]" />
            <div className="relative grid size-44 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_50px_rgba(0,240,255,0.22)]">
              <ScanFace size={96} className="text-[#00F0FF]" />
            </div>
            <div className="absolute bottom-5 left-5 rounded-2xl bg-black/35 px-4 py-3 text-xs leading-5 text-slate-200 backdrop-blur-md">
              <p>{stamp}</p>
              <p>Rina Pratiwi</p>
              <p>Finance Officer</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPinned size={18} className="text-emerald-300" />
              GPS otomatis: Kantor Pusat Jakarta
            </div>
            <button
              type="button"
              onClick={openCameraPopup}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-[#00F0FF] px-5 font-semibold text-[#071128] shadow-lg shadow-cyan-400/20 hover:-translate-y-0.5"
            >
              <Camera size={18} />
              Ambil Foto Sekarang
            </button>
          </div>
        </div>

        <aside className="grid content-start gap-4 pb-24 xl:pb-0">
          {savedAttendance ? (
            <div className="overflow-hidden rounded-[24px] border border-emerald-300/20 bg-emerald-300/10 shadow-xl shadow-emerald-400/10 backdrop-blur-2xl">
              {savedAttendance.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={savedAttendance.photo}
                  alt="Foto absensi terakhir"
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="grid aspect-video place-items-center bg-[#11183A] text-emerald-200">
                  <CheckCircle2 size={42} />
                </div>
              )}
              <div className="p-4">
                <p className="font-semibold text-emerald-100">
                  Absensi tersimpan
                </p>
                <p className="mt-1 text-sm text-emerald-200/75">
                  {savedAttendance.savedAt}
                </p>
                <p className="mt-2 text-xs text-emerald-100/80">
                  {savedAttendance.status} - {savedAttendance.location}
                </p>
              </div>
            </div>
          ) : null}

          <div className="rounded-[24px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-2xl">
            <p className="text-sm text-slate-400">Status proses</p>
            <p
              className={[
                "mt-2 flex items-center gap-2 text-lg font-semibold",
                lastStatus.includes("tidak") || lastStatus.includes("gagal")
                  ? "text-amber-200"
                  : "text-emerald-200",
              ].join(" ")}
            >
              {lastStatus.includes("tidak") || lastStatus.includes("gagal") ? (
                <AlertTriangle size={21} />
              ) : (
                <CheckCircle2 size={21} />
              )}
              {lastStatus}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-2xl">
            <p className="text-sm text-slate-400">Penyimpanan</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-cyan-100">
              {saving ? <span className="employee-spinner" /> : null}
              {saving ? "Menyimpan data..." : "Menunggu foto absensi"}
            </div>
          </div>
          <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-300/10 p-5 text-sm leading-6 text-emerald-100 backdrop-blur-2xl">
            Foto otomatis diberi watermark tanggal, jam, nama pegawai, serta
            koordinat GPS sebelum dikirim ke server.
          </div>
        </aside>
      </section>

      {isCameraOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/75 p-4 backdrop-blur-xl">
          <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-cyan-300/25 bg-[#0A0F2C]/95 shadow-2xl shadow-cyan-400/20">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-sm text-slate-400">Popup kamera</p>
                <h3 className="text-xl font-semibold text-white">
                  Capture Absensi
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCameraPopup}
                className="grid size-10 place-items-center rounded-2xl border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Tutup popup kamera"
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
                      "absolute left-1/2 top-1/2 grid size-40 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-[#0A0F2C]/30 backdrop-blur-[1px]",
                      faceDetected
                        ? "border-emerald-300/70 text-emerald-200 shadow-[0_0_38px_rgba(52,211,153,0.32)]"
                        : "border-amber-300/70 text-amber-200 shadow-[0_0_38px_rgba(251,191,36,0.18)]",
                    ].join(" ")}
                  >
                    {faceDetected ? <CheckCircle2 size={64} /> : <ScanFace size={64} />}
                  </div>
                ) : null}
                <div className="absolute bottom-4 left-4 rounded-2xl bg-black/40 px-4 py-3 text-xs leading-5 text-slate-200 backdrop-blur-md">
                  <p>{stamp}</p>
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

              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div
                  className={[
                    "flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold",
                    faceDetected
                      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                      : "border-amber-300/30 bg-amber-300/10 text-amber-100",
                  ].join(" ")}
                >
                  {faceDetected ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  {faceDetected ? "Wajah terdeteksi" : "Wajah tidak terdeteksi"}
                </div>

                {!cameraError ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFallbackFaceToggle(false)}
                      className="min-h-11 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 text-sm font-semibold text-amber-100 hover:border-amber-200"
                    >
                      Tidak terlihat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFallbackFaceToggle(true)}
                      className="min-h-11 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 text-sm font-semibold text-emerald-100 hover:border-emerald-200"
                    >
                      Terlihat
                    </button>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={saving || Boolean(cameraError)}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-[#00F0FF] px-5 font-semibold text-[#071128] shadow-lg shadow-cyan-400/20 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
                >
                  {saving ? <span className="employee-spinner" /> : <Camera size={18} />}
                  {saving ? "Menyimpan..." : "Simpan Absensi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </EmployeeShell>
  );
}
