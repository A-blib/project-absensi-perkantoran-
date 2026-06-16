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
import { createEmployeeNotification } from "@/lib/browser/employee-notification-store";

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
  const [stamp, setStamp] = useState("");
  const [lastStatus, setLastStatus] = useState("Ready for verification");
  const [savedAttendance, setSavedAttendance] = useState(null);
  const [verificationType, setVerificationType] = useState("masuk");
  const hasCheckedOut =
    savedAttendance?.clockOut && savedAttendance.clockOut !== "--:--:--";
  const savedStatusBadgeClass =
    savedAttendance?.status === "Terlambat"
      ? "border border-[#F59E0B]/28 bg-[#F59E0B]/15 text-[#F59E0B]"
      : "border border-[#34D399]/25 bg-[#34D399]/12 text-[#34D399]";
  const infoRowClass = "rounded-2xl px-4 py-3";
  const cardStyles = {
    main: {
      background: "linear-gradient(145deg, #275C87 0%, #1B4163 100%)",
      borderColor: "rgba(147, 197, 253, 0.46)",
      boxShadow: "0 24px 52px rgba(0,0,0,.38)",
    },
    verification: {
      background: "linear-gradient(145deg, #172F47 0%, #102235 100%)",
      borderColor: "rgba(147, 197, 253, 0.2)",
      boxShadow: "0 14px 34px rgba(0,0,0,.28), 0 0 22px rgba(52,211,153,.08)",
    },
    activity: {
      background: "linear-gradient(145deg, #315F8E 0%, #254A72 100%)",
      borderColor: "rgba(147, 197, 253, 0.34)",
      boxShadow: "0 16px 36px rgba(0,0,0,.3)",
    },
    radius: {
      background: "linear-gradient(145deg, #164A50 0%, #10333A 100%)",
      borderColor: "rgba(45, 212, 191, 0.28)",
      boxShadow: "0 16px 36px rgba(0,0,0,.3)",
    },
    row: {
      background: "linear-gradient(180deg, #234F75 0%, #183B5D 100%)",
      border: "1px solid rgba(255,255,255,.09)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)",
    },
    photoFrame: {
      background:
        "#0C2338 linear-gradient(90deg, rgba(147,197,253,.05) 1px, transparent 1px), linear-gradient(rgba(147,197,253,.04) 1px, transparent 1px)",
      backgroundSize: "28px 28px",
      borderColor: "rgba(147, 197, 253, 0.32)",
      boxShadow: "0 12px 34px rgba(0,0,0,.34)",
    },
  };
  const radiusUsage = savedAttendance?.distance
    ? Math.min(
        100,
        Math.round((savedAttendance.distance / OFFICE_LOCATION.radius) * 100),
      )
    : 0;

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
    context.fillStyle = "#F3F7FF";
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
        createEmployeeNotification({
          title: "Absensi keluar berhasil",
          message: `Absensi keluar tercatat pukul ${time} WIB.`,
          category: "absensi",
          type: "success",
        });
      } else {
        saveEmployeeAttendanceRecord(baseRecord);
        createEmployeeNotification({
          title:
            baseRecord.status === "Terlambat"
              ? "Terlambat masuk"
              : "Absensi berhasil",
          message:
            baseRecord.status === "Terlambat"
              ? `Absensi masuk tercatat pukul ${time} WIB dengan status terlambat.`
              : `Absensi masuk tercatat pukul ${time} WIB.`,
          category: "absensi",
          type: baseRecord.status === "Terlambat" ? "warning" : "success",
        });
      }

      playSuccessSound();
      setSavedAttendance((previous) => ({
        ...(previous || {}),
        ...baseRecord,
        photo:
          verificationType === "keluar"
            ? previous?.photo || baseRecord.photo
            : baseRecord.photo,
        outPhoto:
          verificationType === "keluar"
            ? baseRecord.photo
            : previous?.outPhoto,
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
      setStamp(getStamp());
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
        <div className="fixed right-4 top-24 z-50 rounded-2xl border border-[#8ABFFF]/30 bg-[#1B4164]/95 px-4 py-3 text-sm font-semibold text-[#F3F7FF] shadow-2xl backdrop-blur-xl">
          {notice || warning}
        </div>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-12">
        <section
          className="h-fit self-start rounded-3xl border p-5 xl:col-span-8"
          style={cardStyles.main}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[#A8B5C7]">Face recognition attendance</p>
              <h2 className="mt-1 text-2xl font-bold text-[#F3F7FF]">
                {savedAttendance ? "Ringkasan Kehadiran" : "Verifikasi Kehadiran"}
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#8ABFFF]/22 bg-gradient-to-b from-[#244D73] to-[#173B5B] px-4 py-2 text-sm text-[#B6C7DA]">
              <Radio size={16} className="text-[#8ABFFF]" />
              {OFFICE_LOCATION.label}
            </span>
          </div>

          {savedAttendance ? (
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,.85fr)_minmax(320px,1.15fr)]">
              {savedAttendance.photo ? (
                <div
                  className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px] border p-2"
                  style={cardStyles.photoFrame}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={savedAttendance.photo}
                    alt="Foto absensi tersimpan"
                    className="size-full rounded-2xl"
                    style={{ objectFit: "contain", objectPosition: "center" }}
                  />
                </div>
              ) : (
                <div
                  className="grid aspect-[4/3] place-items-center rounded-[20px] border text-sm font-semibold text-[#B6C7DA]"
                  style={cardStyles.photoFrame}
                >
                  Foto absensi tersimpan
                </div>
              )}
              <div className="flex flex-col gap-4">
                <div className="grid gap-3 text-sm">
                  {[
                    ["Status Kehadiran", savedAttendance.status],
                    ["Jam Masuk", savedAttendance.clockIn],
                    ["Jam Keluar", savedAttendance.clockOut || "--:--:--"],
                    ["Face ID", `${savedAttendance.faceConfidence || 0}%`],
                    ["Radius", `${savedAttendance.distance ?? "-"} m`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className={`${infoRowClass} flex items-center justify-between px-4 py-3`}
                      style={cardStyles.row}
                    >
                      <span className="text-[#A8B5C7]">{label}</span>
                      <span
                        className={[
                          "font-semibold",
                          label === "Status Kehadiran"
                            ? `rounded-full px-3 py-1 ${savedStatusBadgeClass}`
                            : label === "Face ID"
                              ? "text-[#34D399]"
                            : "text-[#F3F7FF]",
                        ].join(" ")}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => openCamera("keluar")}
                    disabled={!savedAttendance?.clockIn || hasCheckedOut}
                    className="flex min-h-11 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#3F7FEA] to-[#2B62C7] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.2)] transition hover:-translate-y-1 hover:bg-[#1D4ED8] disabled:pointer-events-none disabled:opacity-55"
                  >
                    <Clock3 size={20} />
                    {hasCheckedOut ? "Sudah Absen Keluar" : "Absensi Keluar"}
                  </button>
                  <button
                    type="button"
                    onClick={resetAttendanceForTest}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#3B82F6]/55 bg-transparent px-4 text-xs font-bold text-[#C7D6EC] transition hover:bg-[#3B82F6]/12 hover:text-[#F3F7FF]"
                  >
                    Reset Tes Absensi
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                className="relative grid min-h-[280px] place-items-center overflow-hidden rounded-3xl border lg:min-h-[310px]"
                style={cardStyles.photoFrame}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(138,191,255,.14),transparent_40%),linear-gradient(90deg,rgba(138,191,255,.04)_1px,transparent_1px),linear-gradient(rgba(138,191,255,.034)_1px,transparent_1px)] bg-[size:auto,34px_34px,34px_34px]" />
                <div className="absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-[#8ABFFF] to-transparent opacity-45" />
                <div className="relative grid size-44 place-items-center rounded-full border border-[#8ABFFF]/34 bg-[#1B4164] shadow-[0_0_70px_rgba(138,191,255,.2)]">
                  <div className="absolute inset-4 rounded-full border border-dashed border-[#8ABFFF]/28" />
                  <ScanFace size={84} className="text-[#8ABFFF]" />
                </div>
                <div className="absolute bottom-5 left-5 rounded-2xl border border-[#8ABFFF]/24 bg-[#1B4164]/90 p-4 text-sm text-[#B6C7DA] backdrop-blur-xl">
                  <p>{stamp || "Menyiapkan waktu"}</p>
                  <p className="font-semibold text-[#F3F7FF]">Rina Pratiwi</p>
                  <p>Finance Officer</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => openCamera("masuk")}
                  disabled={!TODAY_SCHEDULE.hasSchedule}
                  className="flex min-h-11 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#3F7FEA] to-[#2B62C7] px-6 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.2)] transition hover:-translate-y-1 hover:bg-[#1D4ED8] disabled:pointer-events-none disabled:opacity-55 sm:min-w-[220px]"
                >
                  <Camera size={20} />
                  Mulai Verifikasi
                </button>
                <div className="flex min-h-11 items-center justify-center gap-2.5 rounded-2xl border border-[#8ABFFF]/16 bg-gradient-to-b from-[#1B4568] to-[#143452] px-6 text-sm font-semibold text-[#B6C7DA] sm:min-w-[240px]">
                  <ShieldCheck size={20} className="text-[#34D399]" />
                  GPS validation online
                </div>
              </div>
            </>
          )}
        </section>

        <aside className="space-y-4 xl:col-span-4">
          <div className="rounded-3xl border p-5" style={cardStyles.verification}>
            <p className="text-sm text-[#A8B5C7]">Verification status</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-[#34D399]/12 text-[#34D399]">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="font-semibold text-[#F3F7FF]">{lastStatus}</p>
                <p className="text-sm text-[#A8B5C7]">Realtime biometric check</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border p-5" style={cardStyles.activity}>
            <h3 className="font-semibold text-[#F3F7FF]">Aktivitas Hari Ini</h3>
            {savedAttendance ? (
              <div className="mt-4 space-y-3">
                <div className="grid gap-3 text-sm">
                  <div
                    className={`${infoRowClass} flex items-center justify-between px-4 py-3`}
                    style={cardStyles.row}
                  >
                    <span className="text-[#A8B5C7]">Jam Masuk</span>
                    <span className="font-semibold text-[#F3F7FF]">
                      {savedAttendance.clockIn}
                    </span>
                  </div>
                  <div
                    className={`${infoRowClass} flex items-center justify-between px-4 py-3`}
                    style={cardStyles.row}
                  >
                    <span className="text-[#A8B5C7]">Jam Keluar</span>
                    <span className="font-semibold text-[#F3F7FF]">
                      {savedAttendance.clockOut || "--:--:--"}
                    </span>
                  </div>
                  <div
                    className={`${infoRowClass} flex items-center justify-between px-4 py-3`}
                    style={cardStyles.row}
                  >
                    <span className="text-[#A8B5C7]">Status</span>
                    <span className={`rounded-full px-3 py-1 font-semibold ${savedStatusBadgeClass}`}>
                      {savedAttendance.status}
                    </span>
                  </div>
                  <div className={`${infoRowClass} px-4 py-3`} style={cardStyles.row}>
                    <span className="text-[#A8B5C7]">Lokasi</span>
                    <p className="mt-1 font-semibold text-[#F3F7FF]">
                      {savedAttendance.location || OFFICE_LOCATION.label}
                    </p>
                  </div>
                  <div
                    className={`${infoRowClass} flex items-center justify-between px-4 py-3`}
                    style={cardStyles.row}
                  >
                    <span className="text-[#A8B5C7]">Face ID</span>
                    <span className="font-semibold text-[#F3F7FF]">
                      {savedAttendance.faceConfidence || 0}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[#A8B5C7]">
                Belum ada absensi tersimpan untuk sesi ini.
              </p>
            )}
          </div>

          <div className="rounded-3xl border p-5" style={cardStyles.radius}>
            <h3 className="font-semibold text-[#F3F7FF]">Radius Kantor</h3>
            <div className="mt-4 flex items-start gap-3 text-sm text-[#A8B5C7]">
              <MapPin size={20} className="mt-0.5 text-[#67E8F9]" />
              <div>
                <p className="font-semibold text-[#F3F7FF]">
                  {savedAttendance?.distance
                    ? `${savedAttendance.distance} m dari lokasi kantor`
                    : "Menunggu validasi GPS"}
                </p>
                <p className="mt-1 text-[#A8B5C7]">
                  Batas maksimum {OFFICE_LOCATION.radius} meter
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#0A1E30]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#67E8F9] to-[#2DD4BF]"
                style={{ width: `${radiusUsage}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-[#A8B5C7]">
              {savedAttendance?.distance
                ? `${radiusUsage}% dari batas maksimum`
                : "GPS akan divalidasi setelah wajah cocok."}
            </p>
          </div>
        </aside>
      </div>

      {isCameraOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#050B14]/80 p-3 backdrop-blur-xl sm:p-4">
          <div
            className="flex max-h-[calc(100dvh-24px)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border sm:max-h-[calc(100dvh-32px)]"
            style={cardStyles.main}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[#7DB4FF]/18 px-5 py-2.5 sm:px-6">
              <div>
                <p className="text-sm text-[#A8B5C7]">
                  {verificationType === "keluar" ? "Absensi Keluar" : "Absensi Masuk"}
                </p>
                <h3 className="text-lg font-bold text-[#F3F7FF] sm:text-xl">
                  Capture Absensi
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCamera}
                className="grid size-10 place-items-center rounded-2xl border border-red-500 bg-red-500 text-black shadow-lg shadow-red-500/20 transition hover:bg-red-400"
                aria-label="Tutup kamera"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 overflow-hidden p-3 sm:p-4">
              <canvas ref={canvasRef} className="hidden" />
              <div
                className="relative mx-auto aspect-[3/4] h-[min(52dvh,430px)] max-h-[430px] w-full max-w-[370px] overflow-hidden rounded-3xl border sm:h-[min(54dvh,450px)] sm:max-w-[390px]"
                style={cardStyles.photoFrame}
              >
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="size-full bg-[#0A1E30] object-contain"
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
                <div className="absolute bottom-3 left-3 rounded-2xl border border-[#7DB4FF]/22 bg-[#18395A]/85 p-3 text-sm text-[#A8B5C7] backdrop-blur-xl">
                  <p>{stamp || "Menyiapkan waktu"}</p>
                  <p className="font-semibold text-[#F3F7FF]">Rina Pratiwi</p>
                  <p>{OFFICE_LOCATION.label}</p>
                </div>
              </div>

              {cameraError ? (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                  {cameraError}
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div
                      className={`${infoRowClass} flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#F3F7FF]`}
                      style={cardStyles.row}
                    >
                      {faceDetected ? (
                        <CheckCircle2 size={20} className="text-[#34D399]" />
                      ) : (
                        <Clock3 size={20} className="text-[#7DB4FF]" />
                      )}
                      {faceDetected
                        ? "Wajah valid"
                        : faceModelLoading
                          ? "Memuat model"
                          : "Wajah belum ditemukan"}
                    </div>
                    <div className={`${infoRowClass} px-4 py-2.5`} style={cardStyles.row}>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#A8B5C7]">
                        Confidence
                      </p>
                      <p
                        className={[
                          "mt-1 text-sm font-bold",
                          (faceConfidence || 0) >= 80
                            ? "text-[#34D399]"
                            : "text-[#A8B5C7]",
                        ].join(" ")}
                      >
                        {faceConfidence
                          ? faceConfidence >= 80
                            ? `${faceConfidence}% valid`
                            : `${faceConfidence}% tidak cocok`
                          : "Menunggu"}
                      </p>
                    </div>
                    <div className={`${infoRowClass} px-4 py-2.5`} style={cardStyles.row}>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#A8B5C7]">
                        GPS
                      </p>
                      <p
                        className={[
                          "mt-1 text-sm font-bold",
                          gpsStatus === "valid"
                            ? "text-[#34D399]"
                            : gpsStatus === "invalid" || gpsStatus === "error"
                              ? "text-red-300"
                              : "text-[#A8B5C7]",
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
                    <p className="text-sm font-semibold text-[#A8B5C7]">
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
                      className="flex min-h-11 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#3F7FEA] to-[#2B62C7] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.2)] transition hover:-translate-y-1 hover:bg-[#1D4ED8] disabled:pointer-events-none disabled:opacity-60"
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
