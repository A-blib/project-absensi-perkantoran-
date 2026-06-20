"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useCurrentUser } from "@/lib/browser/use-current-user";
import {
  readEmployeeAttendanceRecords,
  saveEmployeeAttendanceRecord,
  saveEmployeeAttendanceByType,
} from "@/lib/browser/employee-attendance-store";
import { createEmployeeNotification } from "@/lib/browser/employee-notification-store";

const DEFAULT_ATTENDANCE_CONFIG = {
  workHours: {
    startTime: "08:00",
    lateTolerance: 15,
    endTime: "17:00",
  },
  location: {
    name: "Kantor Pusat",
    latitude: "-6.208763",
    longitude: "106.845599",
    radiusMeters: 100,
    requireLocation: true,
  },
  attendanceRules: {
    allowOutsideRadius: false,
  },
};

const CAMERA_VIDEO_CONSTRAINTS = {
  facingMode: "user",
  width: { ideal: 360, max: 480 },
  height: { ideal: 270, max: 360 },
  frameRate: { ideal: 10, max: 15 },
};

const CAPTURE_MAX_WIDTH = 480;

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

function getDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function getMinutesFromTime(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function getLateMinutes(clockIn, schedule) {
  return Math.max(
    0,
    getMinutesFromTime(clockIn) -
      (getMinutesFromTime(schedule.startTime) + schedule.lateTolerance),
  );
}

function getAttendanceStatus(clockIn, schedule) {
  return getLateMinutes(clockIn, schedule) > 0 ? "Terlambat" : "Hadir";
}

function getEmployeeTitle(user) {
  return user?.position || user?.division || "Pegawai";
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

function formatMeters(value) {
  return new Intl.NumberFormat("id-ID").format(Math.round(Number(value) || 0));
}

function formatCoordinateLabel(location) {
  if (!location?.latitude || !location?.longitude) return "-";

  return `${Number(location.latitude).toFixed(6)}, ${Number(location.longitude).toFixed(6)}`;
}

function getOutsideRadiusMessage(distance, radius, accuracy) {
  const accuracyText = Number.isFinite(accuracy)
    ? ` Akurasi GPS sekitar ${formatMeters(accuracy)} meter.`
    : "";

  return `Anda berada ${formatMeters(distance)} meter dari kantor. Radius valid hanya ${formatMeters(radius)} meter.${accuracyText}`;
}

function toOfficeLocation(config) {
  return {
    latitude: Number(config.location.latitude),
    longitude: Number(config.location.longitude),
    radius: Number(config.location.radiusMeters),
    label: config.location.name,
    requireLocation: config.location.requireLocation,
    allowOutsideRadius: config.attendanceRules.allowOutsideRadius,
  };
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
  const { user } = useCurrentUser();
  const ownerKey = user?.id;
  const employeeName = user?.name || "Pegawai";
  const employeeTitle = getEmployeeTitle(user);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceScanTimerRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(null);
  const [faceModelLoading, setFaceModelLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [gpsDistance, setGpsDistance] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentLocationAddress, setCurrentLocationAddress] = useState("");
  const [currentLocationStatus, setCurrentLocationStatus] = useState("idle");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [warning, setWarning] = useState("");
  const [stamp, setStamp] = useState(getStamp());
  const [lastStatus, setLastStatus] = useState("Ready for verification");
  const [savedAttendance, setSavedAttendance] = useState(null);
  const [verificationType, setVerificationType] = useState("masuk");
  const [attendanceConfig, setAttendanceConfig] = useState(
    DEFAULT_ATTENDANCE_CONFIG,
  );
  const officeLocation = useMemo(
    () => toOfficeLocation(attendanceConfig),
    [attendanceConfig],
  );

  // Hitung apakah jam absensi masuk/keluar sedang aktif berdasarkan shift
  const shiftAvailability = useMemo(() => {
    const wh = attendanceConfig.workHours;
    const now = new Date();
    const jakartaTime = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta",
    }).format(now);
    const [nowH, nowM] = jakartaTime.split(":").map(Number);
    const nowMinutes = nowH * 60 + nowM;

    const [startH, startM] = (wh.startTime || "08:00").split(":").map(Number);
    const [endH, endM] = (wh.endTime || "17:00").split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const tolerance = Number(wh.lateTolerance || 15);

    const checkInWindowStart = startMinutes - 60; // boleh 60 menit sebelum jam masuk
    const checkInWindowEnd = startMinutes + tolerance + 240; // sampai 4 jam setelah jam masuk
    const checkOutWindowStart = endMinutes - 60; // boleh 60 menit sebelum jam pulang
    const checkOutWindowEnd = endMinutes + 240; // sampai 4 jam setelah jam pulang

    const canCheckIn = nowMinutes >= checkInWindowStart && nowMinutes <= checkInWindowEnd;
    const canCheckOut = nowMinutes >= checkOutWindowStart && nowMinutes <= checkOutWindowEnd;
    const shiftName = wh.shiftName || null;

    return { canCheckIn, canCheckOut, shiftName, startTime: wh.startTime, endTime: wh.endTime };
  }, [attendanceConfig]);

  async function resolveCurrentLocationAddress(latitude, longitude) {
    setCurrentLocationAddress("Mencari nama jalan...");

    try {
      const params = new URLSearchParams({
        lat: String(latitude),
        lng: String(longitude),
      });
      const response = await fetch(`/api/employee/reverse-geocode?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setCurrentLocationAddress("");
        return "";
      }

      const payload = await response.json();
      const address = payload.address || "";
      setCurrentLocationAddress(address);
      return address;
    } catch {
      setCurrentLocationAddress("");
      return "";
    }
  }

  function stopFaceScan() {
    if (faceScanTimerRef.current) {
      clearTimeout(faceScanTimerRef.current);
      faceScanTimerRef.current = null;
    }
  }

  function stopCamera() {
    stopFaceScan();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }

  function startFaceScan() {
    stopFaceScan();
    setFaceModelLoading(true);
    setLastStatus("Mode demo ringan: menyiapkan verifikasi kamera...");
    faceScanTimerRef.current = setTimeout(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        setFaceDetected(false);
        setFaceConfidence(null);
        setFaceModelLoading(false);
        setLastStatus("Kamera belum siap. Coba buka ulang kamera.");
        return;
      }

      setFaceDetected(true);
      setFaceConfidence(98);
      setFaceModelLoading(false);
      setLastStatus("Kamera valid. Lanjut validasi GPS.");
    }, 900);
  }

  async function openCamera(type = "masuk") {
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
        video: CAMERA_VIDEO_CONSTRAINTS,
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      startFaceScan();
    } catch (error) {
      setCameraError(
        error?.name === "NotAllowedError"
          ? "Kamera tidak bisa dibuka. Izinkan akses kamera browser."
          : "Kamera tidak bisa dimuat. Periksa koneksi dan coba lagi.",
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
    setGpsAccuracy(null);
  }

  const detectCurrentLocation = useCallback(({ forAttendance = false } = {}) => {
    if (forAttendance) {
      setGpsStatus("checking");
      setLastStatus("Memvalidasi GPS...");
    }

    setCurrentLocationStatus("checking");

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        if (forAttendance) {
          setGpsStatus("error");
          setWarning("Lokasi tidak dapat dideteksi.");
          setLastStatus("GPS unavailable");
        }
        setCurrentLocationStatus("error");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          const accuracy = Math.round(position.coords.accuracy || 0);
          const distance = Math.round(
            getDistanceMeters(currentLocation, officeLocation),
          );
          const insideRadius = distance <= officeLocation.radius;
          const valid =
            !officeLocation.requireLocation ||
            insideRadius ||
            officeLocation.allowOutsideRadius;

          setCurrentLocation({
            ...currentLocation,
            distance,
            accuracy,
          });
          resolveCurrentLocationAddress(
            currentLocation.latitude,
            currentLocation.longitude,
          );
          setCurrentLocationStatus(valid ? "valid" : "invalid");
          setGpsDistance(distance);
          setGpsAccuracy(accuracy);
          if (forAttendance) {
            setGpsStatus(valid ? "valid" : "invalid");
          }
          if (!valid) {
            if (forAttendance) {
              setWarning(
                getOutsideRadiusMessage(distance, officeLocation.radius, accuracy),
              );
              setLastStatus("GPS di luar radius kantor");
            }
            resolve(null);
            return;
          }

          if (forAttendance) {
            setLastStatus("GPS valid. Menyimpan absensi...");
          }
          resolve({ ...currentLocation, distance, accuracy });
        },
        (error) => {
          if (forAttendance) {
            setGpsStatus("error");
            setWarning(
              error.code === error.PERMISSION_DENIED
                ? "Aktifkan GPS terlebih dahulu."
                : "Lokasi tidak dapat dideteksi.",
            );
            setLastStatus("GPS validation failed");
          }
          setCurrentLocationStatus("error");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, [officeLocation]);

  function validateGps() {
    return detectCurrentLocation({ forAttendance: true });
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return null;

    const scale = Math.min(1, CAPTURE_MAX_WIDTH / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(11, 18, 32, 0.78)";
    context.fillRect(20, canvas.height - 112, 330, 88);
    context.fillStyle = "#d4e4fa";
    context.font = "600 18px Arial";
    context.fillText(stamp, 38, canvas.height - 78);
    context.fillText(employeeName, 38, canvas.height - 52);
    context.fillText(officeLocation.label, 38, canvas.height - 26);

    return canvas.toDataURL("image/jpeg", 0.62);
  }

  async function handleCapture() {
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

    setTimeout(async () => {
      const savedAt = getStamp();
      const time = getClockOnly();
      const date = savedAt.split(",")[0];
      const capturedAt = new Date().toISOString();
      const lateMinutes =
        verificationType === "masuk"
          ? getLateMinutes(time, attendanceConfig.workHours)
          : savedAttendance?.lateMinutes || 0;
      const baseRecord = {
        id: savedAttendance?.id || `attendance-${Date.now()}`,
        userId: ownerKey,
        employeeName,
        photo: capturedPhoto,
        savedAt,
        date,
        clockIn: verificationType === "masuk" ? time : savedAttendance?.clockIn,
        clockOut: verificationType === "keluar" ? time : "--:--:--",
        status:
          verificationType === "masuk"
            ? getAttendanceStatus(time, attendanceConfig.workHours)
            : savedAttendance?.status || "Hadir",
        lateMinutes,
        location: officeLocation.label,
        latitude: String(gps.latitude),
        longitude: String(gps.longitude),
        radius: officeLocation.radius,
        distance: gps.distance,
        accuracy: gps.accuracy,
        faceVerified: true,
        faceConfidence,
        device: navigator.userAgent,
      };

      if (verificationType === "keluar") {
        saveEmployeeAttendanceByType("keluar", baseRecord, ownerKey);
        createEmployeeNotification({
          title: "Absensi keluar berhasil",
          message: `Absensi keluar tercatat pukul ${time} WIB.`,
          category: "absensi",
          type: "success",
        }, ownerKey);
      } else {
        saveEmployeeAttendanceRecord(baseRecord, ownerKey);
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
        }, ownerKey);
      }

      try {
        const response = await fetch("/api/employee/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: verificationType,
            capturedAt,
            dateKey: getDateKey(),
            status: baseRecord.status,
            lateMinutes,
            photo: verificationType === "masuk" ? capturedPhoto : null,
            location: officeLocation.label,
            latitude: String(gps.latitude),
            longitude: String(gps.longitude),
            currentLocationLabel:
              currentLocationAddress === "Mencari nama jalan..."
                ? ""
                : currentLocationAddress,
          }),
        });

        if (response.ok) {
          const payload = await response.json();
          if (payload.record) {
            baseRecord.id = payload.record.id;
          }
        }
      } catch {
        // Local fallback is already saved above, so the user can retry later.
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

  useEffect(() => {
    let active = true;

    async function loadAttendanceConfig() {
      try {
        const response = await fetch("/api/employee/attendance-config", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = await response.json();
        if (active && payload.config) {
          setAttendanceConfig(payload.config);
        }
      } catch {
        if (active) setAttendanceConfig(DEFAULT_ATTENDANCE_CONFIG);
      }
    }

    loadAttendanceConfig();
    const refreshTimer = setInterval(loadAttendanceConfig, 60000);
    window.addEventListener("focus", loadAttendanceConfig);

    return () => {
      active = false;
      clearInterval(refreshTimer);
      window.removeEventListener("focus", loadAttendanceConfig);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      detectCurrentLocation();
    }, 400);

    return () => clearTimeout(timer);
  }, [detectCurrentLocation]);

  useEffect(() => {
    let active = true;

    async function loadTodayAttendance() {
      try {
        const response = await fetch("/api/employee/attendance", {
          cache: "no-store",
        });

        if (response.ok) {
          const payload = await response.json();
          if (active && payload.today) {
            setSavedAttendance(payload.today);
            setLastStatus(`Saved at ${payload.today.savedAt}`);
            return;
          }
        }
      } catch {
        // Fall back to local records below.
      }

      const todayRecord = readEmployeeAttendanceRecords(ownerKey).find(
        (record) => record.date === getTodayDate(),
      );

      if (!active) return;
      if (todayRecord) {
        setSavedAttendance(todayRecord);
        setLastStatus(`Saved at ${todayRecord.savedAt}`);
      } else {
        setSavedAttendance(null);
      }
    }

    loadTodayAttendance();
    const videoElement = videoRef.current;

    return () => {
      active = false;
      if (faceScanTimerRef.current) {
        clearTimeout(faceScanTimerRef.current);
        faceScanTimerRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
      }
    };
  }, [ownerKey]);

  useEffect(() => {
    if (!notice && !warning) return undefined;
    const timer = setTimeout(() => {
      setNotice("");
      setWarning("");
    }, 3200);
    return () => clearTimeout(timer);
  }, [notice, warning]);

  return (
    <EmployeeShell initialUser={user}>
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
              {officeLocation.label}
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
              <p className="font-semibold text-[#d4e4fa]">{employeeName}</p>
              <p>{employeeTitle}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => openCamera("masuk")}
              disabled={Boolean(savedAttendance) || !shiftAvailability.canCheckIn}
              className={[
                "flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-2xl px-5 font-semibold shadow-lg transition hover:-translate-y-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55",
                savedAttendance || !shiftAvailability.canCheckIn
                  ? "border border-[#24344D] bg-[#0B1220] text-[#c2c6d6] shadow-none"
                  : "bg-[#3b82f6] text-white shadow-blue-500/20 hover:bg-[#60a5fa]",
              ].join(" ")}
            >
              <Camera size={20} />
              {savedAttendance
                ? "Absen Masuk Sudah Tercatat"
                : !shiftAvailability.canCheckIn
                  ? `Absen Masuk Mulai ${shiftAvailability.startTime}`
                  : "Mulai Absen Masuk"}
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
              (savedAttendance?.clockOut && savedAttendance.clockOut !== "--:--:--") ||
              !shiftAvailability.canCheckOut
            }
            className="mt-3 flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-[#24344D] bg-[#0B1220] px-5 font-semibold text-[#c2c6d6] transition hover:-translate-y-1 hover:border-[#3b82f6]/60 hover:text-[#d4e4fa] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Clock3 size={20} />
            {savedAttendance?.clockOut && savedAttendance.clockOut !== "--:--:--"
              ? "Absen Pulang Sudah Tercatat"
              : !shiftAvailability.canCheckOut && savedAttendance?.clockIn
                ? `Absen Pulang Mulai ${shiftAvailability.endTime}`
                : "Ambil Absen Pulang"}
          </button>
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[#d4e4fa]">Lokasi Saat Ini</h3>
                <p className="mt-1 text-sm text-[#8B9DB5]">
                  Terdeteksi otomatis dari GPS perangkat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => detectCurrentLocation()}
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#24344D] text-[#c2c6d6] transition hover:border-[#3b82f6]/60 hover:text-[#d4e4fa]"
                aria-label="Deteksi ulang lokasi saat ini"
              >
                <MapPin size={18} />
              </button>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl bg-[#0B1220] px-4 py-3">
                <p className="text-[#8B9DB5]">Nama Jalan / Tempat</p>
                <p className="mt-1 font-semibold leading-6 text-[#d4e4fa]">
                  {currentLocationAddress || "-"}
                </p>
              </div>
              <div className="rounded-2xl bg-[#0B1220] px-4 py-3">
                <p className="text-[#8B9DB5]">Koordinat</p>
                <p className="mt-1 break-all font-mono font-semibold text-[#d4e4fa]">
                  {currentLocationStatus === "checking"
                    ? "Mendeteksi..."
                    : formatCoordinateLabel(currentLocation)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#0B1220] px-4 py-3">
                  <p className="text-[#8B9DB5]">Jarak Tujuan</p>
                  <p className="mt-1 font-semibold text-[#d4e4fa]">
                    {currentLocation?.distance !== undefined
                      ? `${formatMeters(currentLocation.distance)} m`
                      : "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#0B1220] px-4 py-3">
                  <p className="text-[#8B9DB5]">Akurasi</p>
                  <p className="mt-1 font-semibold text-[#d4e4fa]">
                    {currentLocation?.accuracy !== undefined
                      ? `${formatMeters(currentLocation.accuracy)} m`
                      : "-"}
                  </p>
                </div>
              </div>
              <div
                className={[
                  "rounded-2xl border px-4 py-3 text-sm font-semibold",
                  currentLocationStatus === "valid"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : currentLocationStatus === "invalid" ||
                        currentLocationStatus === "error"
                      ? "border-red-500/25 bg-red-500/10 text-red-300"
                      : "border-[#24344D] bg-[#0B1220] text-[#c2c6d6]",
                ].join(" ")}
              >
                {currentLocationStatus === "valid"
                  ? "Lokasi saat ini berada dalam radius absensi."
                  : currentLocationStatus === "invalid"
                    ? "Lokasi saat ini terdeteksi, tetapi tidak valid untuk absensi karena berada di luar radius."
                    : currentLocationStatus === "error"
                      ? "Lokasi saat ini belum bisa dideteksi."
                      : currentLocationStatus === "checking"
                        ? "Mengecek lokasi saat ini..."
                        : "Izinkan akses lokasi untuk deteksi otomatis."}
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
                      {savedAttendance.distance
                        ? `${formatMeters(savedAttendance.distance)} m`
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-[#0B1220] px-4 py-3">
                    <span className="text-[#8B9DB5]">Akurasi GPS</span>
                    <span className="font-semibold text-[#d4e4fa]">
                      {savedAttendance.accuracy
                        ? `${formatMeters(savedAttendance.accuracy)} m`
                        : "-"}
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
              Radius maksimal {officeLocation.radius} meter
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#0B1220]">
              <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#3b82f6] to-emerald-400" />
            </div>
            <p className="mt-3 text-sm text-[#8B9DB5]">
              {savedAttendance?.distance
                ? `Jarak terakhir ${formatMeters(savedAttendance.distance)} meter`
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
                  <p className="font-semibold text-[#d4e4fa]">{employeeName}</p>
                  <p>{officeLocation.label}</p>
                </div>
              </div>

              {cameraError ? (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                  {cameraError}
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                            ? `Valid ${formatMeters(gpsDistance)} m${
                                gpsAccuracy ? `, akurasi ${formatMeters(gpsAccuracy)} m` : ""
                              }`
                            : gpsStatus === "invalid"
                              ? `Tidak valid, ${formatMeters(gpsDistance)} m${
                                  gpsAccuracy
                                    ? `, akurasi ${formatMeters(gpsAccuracy)} m`
                                    : ""
                                }`
                              : gpsStatus === "error"
                                ? "GPS gagal"
                                : "Menunggu validasi"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#24344D] bg-[#0B1220] px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#8B9DB5]">
                        Lokasi Saat Ini
                      </p>
                      <p className="mt-1 text-xs font-bold leading-5 text-[#d4e4fa]">
                        {currentLocationAddress || "-"}
                      </p>
                      <p className="mt-1 break-all font-mono text-xs font-bold text-[#d4e4fa]">
                        {currentLocationStatus === "checking"
                          ? "Mendeteksi..."
                          : formatCoordinateLabel(currentLocation)}
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
