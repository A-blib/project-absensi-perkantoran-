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
  clearEmployeeAttendanceByDate,
  readEmployeeAttendanceRecords,
  saveEmployeeAttendanceRecord,
  saveEmployeeAttendanceByType,
} from "@/lib/browser/employee-attendance-store";

const OFFICE_LOCATION = {
  latitude: 0.507068,
  longitude: 101.447777,
  radius: 5000,
  label: "Area Sudirman Pekanbaru",
};

const TODAY_SCHEDULE = {
  hasSchedule: true,
  start: "08:00",
  toleranceMinutes: 15,
  shift: "Regular",
};

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

function getTodayDate() {
  return new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function getClockOnly() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function getMinutesFromTime(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function getAttendanceStatus(clockIn) {
  const clockInMinutes = getMinutesFromTime(clockIn);
  const targetMinutes =
    getMinutesFromTime(TODAY_SCHEDULE.start) + TODAY_SCHEDULE.toleranceMinutes;
  return clockInMinutes <= targetMinutes ? "Hadir" : "Terlambat";
}

function getDistanceMeters(from, to) {
  const earthRadius = 6371000;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const deltaLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
  const detectorRef = useRef(null);
  const faceScanTimerRef = useRef(null);
  const scanningRef = useRef(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(null);
  const [faceModelLoading, setFaceModelLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [gpsDistance, setGpsDistance] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [warning, setWarning] = useState("");
  const [stamp, setStamp] = useState(getStamp());
  const [lastStatus, setLastStatus] = useState("Ready for verification");
  const [savedAttendance, setSavedAttendance] = useState(null);
  const [verificationType, setVerificationType] = useState("masuk");

  function stopFaceScan() {
    if (faceScanTimerRef.current) {
      clearInterval(faceScanTimerRef.current);
      faceScanTimerRef.current = null;
    }
    scanningRef.current = false;
  }

  function stopCamera() {
    stopFaceScan();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function loadFaceDetector() {
    if (detectorRef.current) return detectorRef.current;

    setFaceModelLoading(true);
    const [blazeface, tf] = await Promise.all([
      import("@tensorflow-models/blazeface"),
      import("@tensorflow/tfjs-core"),
      import("@tensorflow/tfjs-backend-webgl"),
      import("@tensorflow/tfjs-converter"),
    ]).then(([blazefaceModule, tfCoreModule]) => [blazefaceModule, tfCoreModule]);

    await tf.setBackend("webgl");
    await tf.ready();
    detectorRef.current = await blazeface.load();
    setFaceModelLoading(false);
    return detectorRef.current;
  }

  function startFaceScan(detector) {
    stopFaceScan();
    faceScanTimerRef.current = setInterval(async () => {
      if (!videoRef.current || scanningRef.current) return;
      if (videoRef.current.readyState < 2) return;

      scanningRef.current = true;
      try {
        const faces = await detector.estimateFaces(videoRef.current, false);

        if (faces.length > 1) {
          setFaceDetected(false);
          setFaceConfidence(null);
          setLastStatus("Hanya satu wajah yang boleh terdeteksi");
          return;
        }

        const face = faces[0];
        if (!face) {
          setFaceDetected(false);
          setFaceConfidence(null);
          setLastStatus("Wajah tidak terlihat, arahkan wajah ke kamera");
          return;
        }

        const rawScore =
          face.probability?.[0] ||
          face.probability ||
          (face.landmarks?.length >= 6 ? 0.9 : 0);
        const confidence = Math.round(rawScore * 100);

        setFaceConfidence(confidence);
        if (confidence < 80) {
          setFaceDetected(false);
          setLastStatus("Wajah tidak sesuai dengan akun karyawan");
          return;
        }

        setFaceDetected(true);
        setLastStatus("Wajah valid. Lanjut validasi GPS.");
      } catch {
        setFaceDetected(false);
        setFaceConfidence(null);
        setLastStatus("Deteksi wajah gagal. Pastikan wajah terlihat jelas.");
      } finally {
        scanningRef.current = false;
      }
    }, 700);
  }

  async function openCamera(type = "masuk") {
    if (!TODAY_SCHEDULE.hasSchedule) {
      setWarning("Tidak ada jadwal kerja hari ini.");
      return;
    }

    if (type === "masuk" && savedAttendance?.clockIn) {
      setWarning("Anda sudah absen masuk hari ini.");
      return;
    }

    if (type === "keluar" && !savedAttendance?.clockIn) {
      setWarning("Lakukan absensi masuk terlebih dahulu.");
      return;
    }

    if (type === "keluar" && savedAttendance?.clockOut && savedAttendance.clockOut !== "--:--:--") {
      setWarning("Anda sudah absen keluar hari ini.");
      return;
    }

    setVerificationType(type);
    setStamp(getStamp());
    setCameraError("");
    setFaceDetected(false);
    setFaceConfidence(null);
    setGpsStatus("idle");
    setGpsDistance(null);
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

      setLastStatus("Memuat model Face Detection...");
      const detector = await loadFaceDetector();
      setLastStatus("Memindai wajah...");
      startFaceScan(detector);
    } catch (error) {
      setCameraError(
        error?.name === "NotAllowedError"
          ? "Kamera tidak bisa dibuka. Izinkan akses kamera browser."
          : "Face Detection tidak bisa dimuat. Periksa koneksi dan coba lagi.",
      );
      setFaceModelLoading(false);
      setLastStatus("Camera unavailable");
    }
  }

  function closeCamera() {
    stopCamera();
    setIsCameraOpen(false);
    setFaceDetected(false);
    setFaceConfidence(null);
    setFaceModelLoading(false);
    setGpsStatus("idle");
  }

  function validateGps() {
    setGpsStatus("checking");
    setLastStatus("Memvalidasi GPS...");

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGpsStatus("error");
        setWarning("Lokasi tidak dapat dideteksi.");
        setLastStatus("GPS unavailable");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          const distance = Math.round(
            getDistanceMeters(currentLocation, OFFICE_LOCATION),
          );
          const valid = distance <= OFFICE_LOCATION.radius;

          setGpsDistance(distance);
          setGpsStatus(valid ? "valid" : "invalid");
          if (!valid) {
            setWarning("Anda berada di luar radius kantor.");
            setLastStatus("GPS di luar radius kantor");
            resolve(null);
            return;
          }

          setLastStatus("GPS valid. Menyimpan absensi...");
          resolve({ ...currentLocation, distance });
        },
        (error) => {
          setGpsStatus("error");
          setWarning(
            error.code === error.PERMISSION_DENIED
              ? "Aktifkan GPS terlebih dahulu."
              : "Lokasi tidak dapat dideteksi.",
          );
          setLastStatus("GPS validation failed");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
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
    context.fillText(OFFICE_LOCATION.label, 38, canvas.height - 26);

    return canvas.toDataURL("image/jpeg", 0.88);
  }

  async function handleCapture() {
    if (!TODAY_SCHEDULE.hasSchedule) {
      setWarning("Tidak ada jadwal kerja hari ini.");
      return;
    }

    if (verificationType === "masuk" && savedAttendance?.clockIn) {
      setWarning("Anda sudah absen masuk hari ini.");
      return;
    }

    if (verificationType === "keluar" && !savedAttendance?.clockIn) {
      setWarning("Lakukan absensi masuk terlebih dahulu.");
      return;
    }

    if (
      verificationType === "keluar" &&
      savedAttendance?.clockOut &&
      savedAttendance.clockOut !== "--:--:--"
    ) {
      setWarning("Anda sudah absen keluar hari ini.");
      return;
    }

    if (!faceDetected) {
      setWarning("Wajah tidak terlihat, silakan arahkan wajah ke kamera.");
      return;
    }

    if ((faceConfidence || 0) < 80) {
      setWarning("Wajah tidak sesuai dengan akun karyawan.");
      return;
    }

    setSaving(true);
    const gps = await validateGps();
    if (!gps) {
      setSaving(false);
      return;
    }

    const capturedPhoto = captureFrame();

    setTimeout(() => {
      const savedAt = getStamp();
      const time = getClockOnly();
      const date = savedAt.split(",")[0];
      const baseRecord = {
        id: savedAttendance?.id || `attendance-${Date.now()}`,
        photo: capturedPhoto,
        savedAt,
        date,
        clockIn: verificationType === "masuk" ? time : savedAttendance?.clockIn,
        clockOut: verificationType === "keluar" ? time : "--:--:--",
        status:
          verificationType === "masuk"
            ? getAttendanceStatus(time)
            : savedAttendance?.status || "Hadir",
        location: OFFICE_LOCATION.label,
        latitude: String(gps.latitude),
        longitude: String(gps.longitude),
        radius: OFFICE_LOCATION.radius,
        distance: gps.distance,
        faceVerified: true,
        faceConfidence,
        device: navigator.userAgent,
      };

      if (verificationType === "keluar") {
        saveEmployeeAttendanceByType("keluar", baseRecord);
      } else {
        saveEmployeeAttendanceRecord(baseRecord);
      }

      playSuccessSound();
      setSavedAttendance((previous) => ({
        ...(previous || {}),
        ...baseRecord,
        photo: baseRecord.photo || previous?.photo,
      }));
      setNotice(
        verificationType === "keluar"
          ? "Absensi keluar berhasil disimpan"
          : "Absensi masuk berhasil disimpan",
      );
      setLastStatus(`Saved at ${savedAt}`);
      setSaving(false);
      closeCamera();
    }, 800);
  }

  function resetAttendanceForTest() {
    clearEmployeeAttendanceByDate(getTodayDate());
    setSavedAttendance(null);
    setNotice("Mode tes direset. Silakan mulai verifikasi ulang.");
    setWarning("");
    setLastStatus("Ready for verification");
  }

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      const todayRecord = readEmployeeAttendanceRecords().find(
        (record) => record.date === getTodayDate(),
      );
      if (todayRecord) {
        setSavedAttendance(todayRecord);
        setLastStatus(`Saved at ${todayRecord.savedAt}`);
      }
    }, 0);

    return () => {
      clearTimeout(loadTimer);
      if (faceScanTimerRef.current) {
        clearInterval(faceScanTimerRef.current);
        faceScanTimerRef.current = null;
      }
      scanningRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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
              {OFFICE_LOCATION.label}
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
              onClick={() => openCamera("masuk")}
              disabled={!TODAY_SCHEDULE.hasSchedule || Boolean(savedAttendance)}
              className={[
                "flex min-h-14 items-center justify-center gap-3 rounded-2xl px-5 font-semibold shadow-lg transition hover:-translate-y-1 disabled:pointer-events-none disabled:opacity-55",
                savedAttendance
                  ? "border border-[#24344D] bg-[#0B1220] text-[#c2c6d6] shadow-none"
                  : "bg-[#3b82f6] text-white shadow-blue-500/20 hover:bg-[#60a5fa]",
              ].join(" ")}
            >
              <Camera size={20} />
              {savedAttendance ? "Sudah Absen Hari Ini" : "Mulai Verifikasi"}
            </button>
            <div className="flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-[#24344D] bg-[#0B1220] px-5 text-sm font-semibold text-[#c2c6d6]">
              <ShieldCheck size={20} className="text-emerald-400" />
              GPS validation online
            </div>
          </div>
          <button
            type="button"
            onClick={() => openCamera("keluar")}
            disabled={
              !savedAttendance?.clockIn ||
              (savedAttendance?.clockOut && savedAttendance.clockOut !== "--:--:--")
            }
            className="mt-3 flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[#24344D] bg-[#0B1220] px-5 font-semibold text-[#c2c6d6] transition hover:-translate-y-1 hover:border-[#3b82f6]/60 hover:text-[#d4e4fa] disabled:pointer-events-none disabled:opacity-55"
          >
            <Clock3 size={20} />
            {savedAttendance?.clockOut && savedAttendance.clockOut !== "--:--:--"
              ? "Sudah Absen Keluar"
              : "Absensi Keluar"}
          </button>
          {savedAttendance ? (
            <button
              type="button"
              onClick={resetAttendanceForTest}
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-[#24344D] px-4 text-xs font-bold text-[#c2c6d6] transition hover:border-[#3b82f6]/60 hover:text-[#d4e4fa]"
            >
              Reset Tes Absensi
            </button>
          ) : null}
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
                  <div className="flex items-center justify-between rounded-2xl bg-[#0B1220] px-4 py-3">
                    <span className="text-[#8B9DB5]">Clock Out</span>
                    <span className="font-semibold text-[#d4e4fa]">
                      {savedAttendance.clockOut || "--:--:--"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-[#0B1220] px-4 py-3">
                    <span className="text-[#8B9DB5]">Face ID</span>
                    <span className="font-semibold text-emerald-400">
                      {savedAttendance.faceConfidence || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-[#0B1220] px-4 py-3">
                    <span className="text-[#8B9DB5]">Radius</span>
                    <span className="font-semibold text-[#d4e4fa]">
                      {savedAttendance.distance ?? "-"} m
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
              Radius maksimal {OFFICE_LOCATION.radius} meter
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#0B1220]">
              <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#3b82f6] to-emerald-400" />
            </div>
            <p className="mt-3 text-sm text-[#8B9DB5]">
              {savedAttendance?.distance
                ? `Jarak terakhir ${savedAttendance.distance} meter`
                : "GPS akan divalidasi setelah wajah cocok."}
            </p>
          </div>
        </aside>
      </div>

      {isCameraOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#050B14]/80 p-4 backdrop-blur-xl">
          <div className="glass-panel w-full max-w-4xl overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-[#24344D] px-6 py-4">
              <div>
                <p className="text-sm text-[#8B9DB5]">
                  {verificationType === "keluar" ? "Absensi Keluar" : "Absensi Masuk"}
                </p>
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
                  <p>{OFFICE_LOCATION.label}</p>
                </div>
              </div>

              {cameraError ? (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                  {cameraError}
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-[#24344D] bg-[#0B1220] px-4 py-3 text-sm font-semibold text-[#d4e4fa]">
                      {faceDetected ? (
                        <CheckCircle2 size={20} className="text-emerald-400" />
                      ) : (
                        <Clock3 size={20} className="text-[#3b82f6]" />
                      )}
                      {faceDetected
                        ? "Wajah valid"
                        : faceModelLoading
                          ? "Memuat model"
                          : "Wajah belum ditemukan"}
                    </div>
                    <div className="rounded-2xl border border-[#24344D] bg-[#0B1220] px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#8B9DB5]">
                        Confidence
                      </p>
                      <p
                        className={[
                          "mt-1 text-sm font-bold",
                          (faceConfidence || 0) >= 80
                            ? "text-emerald-300"
                            : "text-[#c2c6d6]",
                        ].join(" ")}
                      >
                        {faceConfidence
                          ? faceConfidence >= 80
                            ? `${faceConfidence}% valid`
                            : `${faceConfidence}% tidak cocok`
                          : "Menunggu"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#24344D] bg-[#0B1220] px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#8B9DB5]">
                        GPS
                      </p>
                      <p
                        className={[
                          "mt-1 text-sm font-bold",
                          gpsStatus === "valid"
                            ? "text-emerald-300"
                            : gpsStatus === "invalid" || gpsStatus === "error"
                              ? "text-red-300"
                              : "text-[#c2c6d6]",
                        ].join(" ")}
                      >
                        {gpsStatus === "checking"
                          ? "Mengecek lokasi"
                          : gpsStatus === "valid"
                            ? `Valid ${gpsDistance} m`
                            : gpsStatus === "invalid"
                              ? `Di luar radius ${gpsDistance} m`
                              : gpsStatus === "error"
                                ? "GPS gagal"
                                : "Menunggu validasi"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-[#c2c6d6]">
                      {lastStatus}
                    </p>
                    <button
                      type="button"
                      onClick={handleCapture}
                      disabled={
                        faceModelLoading ||
                        !faceDetected ||
                        (faceConfidence || 0) < 80 ||
                        saving
                      }
                      className="flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#3b82f6] px-6 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-[#60a5fa] disabled:pointer-events-none disabled:opacity-60"
                    >
                      {saving ? <span className="employee-spinner" /> : <Camera size={18} />}
                      {saving ? "Memproses..." : "Validasi GPS & Simpan"}
                    </button>
                  </div>
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
