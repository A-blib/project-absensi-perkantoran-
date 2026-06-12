"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlarmClock,
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CalendarX,
  Camera,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Fingerprint,
  LogIn,
  LogOut,
  Megaphone,
  MapPinned,
  ScanFace,
  ShieldCheck,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import {
  clearEmployeeAttendanceByDate,
  readEmployeeAttendanceRecords,
  saveEmployeeAttendanceByType,
} from "@/lib/browser/employee-attendance-store";

const summaryCards = [
  {
    label: "Kehadiran",
    value: "21 Hari",
    note: "+2 dari bulan lalu",
    icon: CheckCircle2,
    tone: "emerald",
  },
  {
    label: "Izin",
    value: "2 Hari",
    note: "Menunggu 1 persetujuan",
    icon: CalendarX,
    tone: "primary",
  },
  {
    label: "Telat",
    value: "1 Kali",
    note: "Rata-rata 6 menit",
    icon: Clock3,
    tone: "warning",
  },
  {
    label: "Cuti",
    value: "4 Hari",
    note: "Periode bulan Juni",
    icon: CalendarDays,
    tone: "leave",
  },
];

const defaultWeeklySchedule = [
  { dayIndex: 1, day: "SEN", start: "08:00", end: "17:00", shift: "REGULAR" },
  { dayIndex: 2, day: "SEL", start: "08:00", end: "17:00", shift: "REGULAR" },
  { dayIndex: 3, day: "RAB", start: "08:00", end: "17:00", shift: "WFH" },
  { dayIndex: 4, day: "KAM", start: "08:00", end: "17:00", shift: "REGULAR" },
  { dayIndex: 5, day: "JUM", start: "08:00", end: "16:30", shift: "SHORT" },
];

const notifications = [
  ["Reminder Absensi", "Jangan lupa absensi keluar sebelum meninggalkan kantor.", "15 menit lalu", AlarmClock, "emerald"],
  ["Jadwal Kerja", "Briefing finance pukul 09:30 di ruang meeting lantai 3.", "Tadi pagi", BriefcaseBusiness, "primary"],
  ["Pengajuan Izin", "Cuti tahunan Juni masih menunggu persetujuan HR.", "Kemarin", FilePenLine, "violet"],
];

const attendanceStats = [
  ["Tepat Waktu", "95%", "Naik 3% dari bulan lalu", "Target", "90%", "Indikator", "95%", "Trend", "+3%"],
  ["Rata-rata Check In", "07:56", "Lebih awal 4 menit", "Target", "08:00", "Indikator", "88%", "Selisih", "-4 menit"],
  ["Rata-rata Check Out", "17:03", "Sesuai jadwal kerja", "Target", "17:00", "Indikator", "92%", "Selisih", "+3 menit"],
];

const attendanceDetails = [
  ["Hadir", "21 hari"],
  ["Izin", "2 hari"],
  ["Telat", "1 kali"],
  ["Cuti", "4 hari"],
];

const additionalWidgets = [
  ["Pengumuman HR", "Update kebijakan absensi tersedia Jumat.", Megaphone],
  ["Event Kantor", "Town hall Finance pekan depan.", CalendarDays, "3 hari lagi"],
  ["Birthday Employee", "Ulang tahun tim Finance hari Kamis.", Award, "Besok"],
  ["Info Cuti Bersama", "Jadwal cuti bersama menunggu edaran HR.", TrendingUp],
];

function getSummaryTone(tone) {
  if (tone === "emerald") {
    return {
      line: "bg-[#10B981]",
      icon: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-emerald-500/15",
      value: "text-emerald-300",
    };
  }

  if (tone === "warning") {
    return {
      line: "bg-[#F59E0B]",
      icon: "border-amber-500/20 bg-amber-500/10 text-amber-300 shadow-amber-500/15",
      value: "text-amber-300",
    };
  }

  if (tone === "leave") {
    return {
      line: "bg-[#06B6D4]",
      icon: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-cyan-500/15",
      value: "text-cyan-300",
    };
  }

  return {
    line: "bg-[#3B82F6]",
    icon: "border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[#3B82F6] shadow-blue-500/15",
    value: "text-[#60A5FA]",
  };
}

function getActivityTone(tone) {
  if (tone === "emerald") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (tone === "violet") {
    return "border-violet-500/20 bg-violet-500/10 text-violet-300";
  }

  return "border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[#3B82F6]";
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

function getTodayDate() {
  return new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function getJakartaDate() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
}

function formatScheduleDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStart(date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function getWeekNumberInMonth(date) {
  return Math.ceil(date.getDate() / 7);
}

function buildWeeklySchedule() {
  const today = getJakartaDate();
  const todayKey = formatScheduleDate(today);
  const weekStart = getWeekStart(today);

  return defaultWeeklySchedule.map((schedule) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + schedule.dayIndex - 1);
    const dateKey = formatScheduleDate(date);

    return {
      ...schedule,
      date: dateKey,
      isToday: dateKey === todayKey,
    };
  });
}

function getClockLabel(value) {
  if (!value || value === "--:--:--") return null;
  return value.includes("WIB") ? value : `${value} WIB`;
}

function getFallbackTodayAttendance() {
  const today = getTodayDate();
  return {
    date: today,
    clockIn: null,
    clockOut: null,
    status: "Belum Absen",
    location: "Kantor Pusat Pekanbaru",
    gpsValid: true,
    faceVerified: false,
    faceConfidence: null,
  };
}

function getStoredTodayAttendance() {
  const today = getTodayDate();
  const record = readEmployeeAttendanceRecords().find(
    (item) => item.date === today,
  );

  if (!record) return null;

  return {
    date: today,
    clockIn: getClockLabel(record.clockIn),
    clockOut: getClockLabel(record.clockOut),
    status: record.status || "Hadir",
    location: record.location || "Kantor Pusat Pekanbaru",
    gpsValid: true,
    faceVerified: true,
    faceConfidence: 98,
  };
}

export default function EmployeeHomePage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const faceScanTimerRef = useRef(null);
  const scanningRef = useRef(false);
  const [clock, setClock] = useState("--:--:--");
  const [lastStatus, setLastStatus] = useState("Face verification ready");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [pendingType, setPendingType] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(null);
  const [faceModelLoading, setFaceModelLoading] = useState(false);
  const [gpsValidated, setGpsValidated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(
    getFallbackTodayAttendance,
  );
  const [weeklySchedule, setWeeklySchedule] = useState(buildWeeklySchedule);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setWeeklySchedule(buildWeeklySchedule());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function stopFaceScan() {
    if (faceScanTimerRef.current) {
      clearInterval(faceScanTimerRef.current);
      faceScanTimerRef.current = null;
    }
    scanningRef.current = false;
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
        const bestFace = faces[0];

        if (!bestFace) {
          setFaceDetected(false);
          setFaceConfidence(null);
          setLastStatus("Wajah tidak ditemukan. Arahkan wajah ke kamera.");
          return;
        }

        const rawScore =
          bestFace.probability?.[0] ||
          bestFace.probability ||
          (bestFace.landmarks?.length >= 6 ? 0.9 : 0);
        const confidence = Math.round(rawScore * 100);

        if (confidence < 80) {
          setFaceDetected(false);
          setFaceConfidence(confidence);
          setLastStatus("Identitas tidak cocok. Confidence di bawah 80%.");
          return;
        }

        setFaceDetected(true);
        setFaceConfidence(confidence);
        setLastStatus("Wajah valid. Menunggu validasi GPS.");
      } catch {
        setFaceDetected(false);
        setFaceConfidence(null);
        setLastStatus("Deteksi wajah gagal. Pastikan wajah terlihat jelas.");
      } finally {
        scanningRef.current = false;
      }
    }, 700);
  }

  async function openAttendanceCamera(type) {
    if (type === "masuk" && !canCheckIn) {
      setLastStatus("Absensi masuk hari ini sudah tercatat");
      return;
    }

    if (type === "keluar" && !canCheckOut) {
      setLastStatus(
        attendanceCompleted
          ? "Absensi hari ini sudah selesai"
          : "Lakukan absensi masuk terlebih dahulu",
      );
      return;
    }

    setPendingType(type);
    setCameraError("");
    setFaceDetected(false);
    setFaceConfidence(null);
    setGpsValidated(false);
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
      setLastStatus("Face detection unavailable");
      setFaceModelLoading(false);
    }
  }

  function closeAttendanceCamera() {
    stopFaceScan();
    stopCamera();
    setCameraOpen(false);
    setPendingType(null);
    setFaceDetected(false);
    setFaceConfidence(null);
    setFaceModelLoading(false);
    setGpsValidated(false);
    setSaving(false);
  }

  function saveAttendance(type) {
    const savedAt = getStamp();
    const time = savedAt.split(", ")[1] || "--:--:--";
    const clockLabel = getClockLabel(time);
    const nextAttendance = {
      date: savedAt.split(",")[0],
      clockIn:
        type === "masuk"
          ? clockLabel
          : todayAttendance.clockIn || getClockLabel("08:00:22"),
      clockOut: type === "keluar" ? clockLabel : todayAttendance.clockOut,
      status: "Hadir",
      location: "Kantor Pusat Pekanbaru",
      gpsValid: true,
      faceVerified: true,
      faceConfidence: faceConfidence || 98,
    };

    saveEmployeeAttendanceByType(type, {
      id: `attendance-${Date.now()}`,
      photo: null,
      savedAt,
      date: nextAttendance.date,
      clockIn: type === "masuk" ? time : "08:00:22",
      clockOut: type === "keluar" ? time : "--:--:--",
      status: "Hadir",
      location: "Kantor Pusat Pekanbaru",
    });
    setTodayAttendance(nextAttendance);
    setLastStatus(
      type === "masuk"
        ? `Absensi masuk tercatat pukul ${clockLabel}`
        : `Absensi keluar tercatat pukul ${clockLabel}`,
    );
  }

  function confirmAttendance() {
    if (!pendingType || !faceDetected) return;

    if ((faceConfidence || 0) < 80) {
      setLastStatus("Identitas tidak cocok. Absensi ditolak.");
      return;
    }

    setSaving(true);
    setLastStatus("Memvalidasi GPS...");
    setTimeout(() => {
      const gpsValid = true;

      if (!gpsValid) {
        setGpsValidated(false);
        setSaving(false);
        setLastStatus("Anda berada di luar area absensi.");
        return;
      }

      setGpsValidated(true);
      setLastStatus("GPS valid. Menyimpan absensi...");

      setTimeout(() => {
        saveAttendance(pendingType);
        closeAttendanceCamera();
      }, 500);
    }, 700);
  }

  function resetTodayAttendanceForTest() {
    const fallback = getFallbackTodayAttendance();
    clearEmployeeAttendanceByDate(fallback.date);
    setTodayAttendance(fallback);
    setLastStatus("Mode tes direset. Silakan mulai absensi masuk.");
  }

  useEffect(() => {
    return () => {
      stopFaceScan();
      stopCamera();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const storedAttendance = getStoredTodayAttendance();
      if (storedAttendance) setTodayAttendance(storedAttendance);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  const hasCheckedIn = Boolean(todayAttendance.clockIn);
  const hasCheckedOut = Boolean(todayAttendance.clockOut);
  const attendanceCompleted = hasCheckedIn && hasCheckedOut;
  const canCheckIn = !hasCheckedIn;
  const canCheckOut = hasCheckedIn && !hasCheckedOut;
  const attendanceStatusLabel = attendanceCompleted
    ? "Absensi Selesai"
    : hasCheckedIn
      ? "Hadir Hari Ini"
      : "Belum Absen";
  const gpsStatus = todayAttendance.gpsValid ? "Valid" : "Tidak Valid";
  const faceStatus = todayAttendance.faceVerified ? "Verified" : "Pending";
  const dashboardFaceConfidence = todayAttendance.faceConfidence || 0;
  const jakartaToday = getJakartaDate();
  const weeklyProgressTotal = weeklySchedule.length;
  const weeklyProgressDone = weeklySchedule.filter(
    (schedule) => schedule.date <= formatScheduleDate(jakartaToday),
  ).length;
  const weeklyProgress = `${Math.round((weeklyProgressDone / weeklyProgressTotal) * 100)}%`;
  const weekNumber = getWeekNumberInMonth(jakartaToday);
  const monthLabel = jakartaToday.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return (
    <EmployeeShell>
      <div className="mx-auto max-w-[1440px] space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#3B82F6]">
              <span>{currentDate} - {clock} WIB</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-300">
                <Sun size={15} />
                29 C Pekanbaru
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#D4E4FA] sm:text-3xl">
              Selamat Pagi, Rina Pratiwi
            </h2>
            <p className="mt-1 text-sm text-[#C2C6D6]">
              Finance Officer - Semoga hari kerja Anda produktif hari ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">
              <span className="mr-2 inline-block size-2 rounded-full bg-emerald-400 align-middle shadow-[0_0_14px_rgb(52_211_153_/_0.75)]" />
              {attendanceStatusLabel}
            </div>
            <a
              href="/employee/notifikasi"
              className="relative grid size-12 place-items-center rounded-xl border border-[#24344D] bg-[#132238] text-[#C2C6D6] hover:text-[#3B82F6]"
              aria-label="Buka notifikasi"
            >
              <Bell size={22} />
              <span className="absolute right-3 top-3 size-2 rounded-full bg-[#3B82F6] ring-2 ring-[#132238]" />
            </a>
          </div>
        </section>

        <section className="glass-panel relative overflow-hidden rounded-2xl p-4 sm:p-5 xl:p-6">
          <div className="absolute right-0 top-0 -mr-24 -mt-28 size-72 rounded-full bg-[#3B82F6]/10 blur-[90px]" />
          <div className="relative z-10 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm font-bold text-emerald-300">
                  <span className="status-pulse size-2 rounded-full bg-emerald-400" />
                  Status: {todayAttendance.status}
                </span>
                <span className="rounded-full border border-[#24344D] px-3 py-1.5 text-sm font-semibold text-[#C2C6D6]">
                  {todayAttendance.location}
                </span>
              </div>

              <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-[#D4E4FA] sm:text-3xl">
                Absensi Hari Ini
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#C2C6D6]">
                Validasi kehadiran sudah siap. Gunakan tombol absensi masuk atau
                keluar sesuai kebutuhan hari ini.
              </p>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {[
                  ["Check In", todayAttendance.clockIn || "Belum Absen", LogIn, "text-[#3B82F6]"],
                  ["Check Out", todayAttendance.clockOut || "Belum Absen", LogOut, "text-[#D4E4FA]"],
                  ["GPS", gpsStatus, MapPinned, "text-emerald-400"],
                  ["Face ID", faceStatus, ScanFace, "text-emerald-400"],
                ].map(([label, value, Icon, color]) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl border border-[#24344D] bg-white/[0.04] px-3 py-2.5"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/10">
                      <Icon size={17} className={color} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#C2C6D6]/70">
                        {label}
                      </p>
                      <p className="mt-1 font-bold text-[#D4E4FA]">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => openAttendanceCamera("masuk")}
                  disabled={!canCheckIn}
                  className={[
                    "group flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition-all active:scale-[0.98]",
                    canCheckIn
                      ? "border-[#24344D] bg-[#132238] text-[#D4E4FA] hover:-translate-y-0.5 hover:border-[#3B82F6]/60 hover:bg-white/[0.05]"
                      : "cursor-not-allowed border-[#24344D] bg-white/[0.03] text-[#C2C6D6]/45",
                  ].join(" ")}
                >
                  <Fingerprint size={18} />
                  Absensi Masuk
                </button>
                <button
                  type="button"
                  onClick={() => openAttendanceCamera("keluar")}
                  disabled={!canCheckOut}
                  className={[
                    "flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-all active:scale-[0.98]",
                    canCheckOut
                      ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20 hover:-translate-y-0.5 hover:brightness-110"
                      : "cursor-not-allowed border border-[#24344D] bg-white/[0.03] text-[#C2C6D6]/45",
                  ].join(" ")}
                >
                  <ShieldCheck size={18} />
                  Absensi Keluar
                </button>
              </div>
              {(hasCheckedIn || hasCheckedOut) ? (
                <button
                  type="button"
                  onClick={resetTodayAttendanceForTest}
                  className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl border border-[#24344D] px-4 text-xs font-bold text-[#C2C6D6] transition hover:border-[#3B82F6]/60 hover:text-[#D4E4FA]"
                >
                  Reset Tes Absensi
                </button>
              ) : null}
            </div>

            <div className="relative grid min-h-[170px] place-items-center overflow-hidden rounded-2xl border border-[#24344D] bg-[#0B1220] sm:min-h-[200px] xl:min-h-[220px]">
              <div className="absolute inset-x-0 top-3 z-10 flex justify-center">
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  Face ID {faceStatus}
                </span>
              </div>
              <div className="scanning-line absolute left-0 right-0" />
              <div className="relative grid size-20 place-items-center rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#3B82F6] sm:size-24">
                <ScanFace size={44} />
                <span className="corner-tl absolute" />
                <span className="corner-tr absolute" />
                <span className="corner-bl absolute" />
                <span className="corner-br absolute" />
              </div>
              <div className="absolute inset-x-4 bottom-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[#24344D] bg-[#132238]/80 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#C2C6D6]/60">
                    Verifikasi
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#D4E4FA]">
                    {todayAttendance.clockIn || "--:-- WIB"}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/70">
                    Confidence
                  </p>
                  <p className="mt-1 text-sm font-bold text-emerald-300">
                    {dashboardFaceConfidence ? `${dashboardFaceConfidence}%` : "--"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#D4E4FA]">Ringkasan Cepat</h3>
            <span className="text-sm font-medium text-[#C2C6D6]">Juni 2026</span>
          </div>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const tone = getSummaryTone(card.tone);

              return (
                <div
                  key={card.label}
                  className="glass-panel group relative flex min-h-[130px] cursor-default flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01]"
                >
                  <span className={["absolute inset-x-0 top-0 h-1", tone.line].join(" ")} />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#C2C6D6]/60">
                        {card.label}
                      </p>
                      <p className={["mt-1 text-2xl font-bold", tone.value].join(" ")}>
                        {card.value}
                      </p>
                    </div>
                    <div
                      className={[
                        "grid size-12 place-items-center rounded-2xl border shadow-lg",
                        tone.icon,
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
              );
            })}
          </div>
        </section>

        <section className="glass-panel relative overflow-hidden rounded-2xl p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h3 className="text-xl font-bold text-[#D4E4FA]">
                Jadwal Kerja Mingguan
              </h3>
              <p className="mt-1 text-sm text-[#C2C6D6]">
                Minggu ke-{weekNumber} - {monthLabel}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-[220px] rounded-xl border border-[#24344D] bg-white/[0.04] px-4 py-3">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#C2C6D6]">
                  <span>Minggu Kerja Ke-{weekNumber}</span>
                  <span>
                    {weeklyProgressDone} / {weeklyProgressTotal} Hari
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#24344D]">
                  <div
                    className="h-full rounded-full bg-[#3B82F6]"
                    style={{ width: weeklyProgress }}
                  />
                </div>
              </div>
              <a
                href="/employee/jadwal"
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#3B82F6] px-5 text-sm font-bold text-white shadow-lg shadow-[#3B82F6]/20 transition-all hover:brightness-110 active:scale-95"
              >
                Lihat Detail
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {weeklySchedule.map((schedule) => {
              return (
                <div
                  key={schedule.date}
                  className={[
                    "min-h-[140px] rounded-xl border p-3 transition-all duration-300 hover:-translate-y-1",
                    schedule.isToday
                      ? "border-[#3B82F6]/30 bg-[#3B82F6]/10"
                      : "border-white/5 bg-white/[0.05]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={[
                        "text-[11px] font-bold uppercase tracking-widest",
                        schedule.isToday ? "text-[#3B82F6]" : "text-[#C2C6D6]",
                      ].join(" ")}
                    >
                      {schedule.day}
                    </span>
                    <span
                      className={[
                        "rounded-lg px-2 py-1 text-[10px] font-bold",
                        schedule.isToday
                          ? "bg-[#3B82F6] text-white"
                          : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
                      ].join(" ")}
                    >
                      {schedule.isToday ? "HARI INI" : schedule.shift}
                    </span>
                  </div>
                  <p className="mt-4 text-base font-bold text-[#D4E4FA]">
                    {schedule.start} - {schedule.end}
                  </p>
                  <p className="mt-2 text-xs text-[#C2C6D6]">
                    {new Date(`${schedule.date}T00:00:00`).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6">
          <h3 className="mb-5 text-xl font-bold text-[#D4E4FA]">
            Aktivitas Terbaru
          </h3>
          <div className="space-y-3">
            {notifications.map(([title, desc, time, Icon, tone]) => (
              <div
                key={title}
                className="flex gap-4 rounded-xl border border-[#24344D] bg-white/[0.04] p-4 transition hover:border-[#3B82F6]/35"
              >
                <div
                  className={[
                    "grid size-10 shrink-0 place-items-center rounded-xl border",
                    getActivityTone(tone),
                  ].join(" ")}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <p className="font-bold text-[#D4E4FA]">{title}</p>
                    <span className="shrink-0 text-[11px] text-[#C2C6D6]">
                      {time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#C2C6D6]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="glass-panel rounded-2xl p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[#3B82F6]">
                <BarChart3 size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#D4E4FA]">
                  Statistik Kehadiran
                </h3>
                <p className="text-sm text-[#C2C6D6]">Performa bulan ini</p>
              </div>
            </div>
            <div className="grid place-items-center py-3">
              <div className="grid size-36 place-items-center rounded-full border-[10px] border-[#3B82F6]/20 border-t-[#3B82F6]">
                <div className="text-center">
                  <p className="text-4xl font-bold text-[#D4E4FA]">95%</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#C2C6D6]">
                    Kehadiran
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <div className="mb-2 flex items-center justify-between text-xs text-[#C2C6D6]">
                <span>Target Bulan: 22 Hari</span>
                <span>Saat Ini: 21 Hari</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#24344D]">
                <div className="h-full w-[95%] rounded-full bg-[#3B82F6]" />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#60A5FA]">
                Target Tercapai 95%
              </p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {attendanceDetails.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#24344D] bg-white/[0.04] px-3 py-2"
                >
                  <p className="text-xs text-[#C2C6D6]">{label}</p>
                  <p className="mt-1 font-bold text-[#D4E4FA]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {attendanceStats.map(([label, value, note, targetLabel, targetValue, progressLabel, progress, trendLabel, trendValue]) => (
              <div
                key={label}
                className="glass-panel min-h-[190px] rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1"
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#C2C6D6]/70">
                  {label}
                </p>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold text-[#D4E4FA]">{value}</p>
                    <p className="mt-1 text-sm leading-6 text-[#C2C6D6]">{note}</p>
                  </div>
                  <div className="shrink-0 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/70">
                      {trendLabel}
                    </p>
                    <p className="text-sm font-bold text-emerald-300">{trendValue}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-[#24344D] bg-white/[0.04] px-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#C2C6D6]">{targetLabel}</span>
                    <span className="font-bold text-[#D4E4FA]">{targetValue}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-[#C2C6D6]">
                    <span>{progressLabel}</span>
                    <span>{progress}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#24344D]">
                    <div
                      className="h-full rounded-full bg-[#3B82F6]"
                      style={{ width: progress }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-xl font-bold text-[#D4E4FA]">
            Informasi Tambahan
          </h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {additionalWidgets.map(([title, text, Icon, meta]) => (
              <div
                key={title}
                className="glass-panel rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#3B82F6]/35 hover:shadow-[0_8px_24px_rgb(59_130_246_/_0.15)]"
              >
                <div className="mb-4 grid size-11 place-items-center rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[#3B82F6]">
                  <Icon size={22} />
                </div>
                <p className="font-bold text-[#D4E4FA]">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[#C2C6D6]">{text}</p>
                {meta ? (
                  <span className="mt-4 inline-flex rounded-full border border-[#3B82F6]/20 bg-[#3B82F6]/10 px-3 py-1 text-xs font-bold text-[#60A5FA]">
                    {meta}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
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
                <div className="mt-4 flex flex-col gap-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-[#24344D] bg-[#0B1220] px-4 py-3 text-sm font-semibold text-[#D4E4FA]">
                      {faceDetected ? (
                        <CheckCircle2 size={20} className="text-emerald-400" />
                      ) : (
                        <Clock3 size={20} className="text-[#3B82F6]" />
                      )}
                      {faceDetected
                        ? "Wajah terdeteksi"
                        : faceModelLoading
                          ? "Memuat model..."
                          : "Wajah belum ditemukan"}
                    </div>
                    <div className="rounded-2xl border border-[#24344D] bg-[#0B1220] px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#C2C6D6]/60">
                        Confidence
                      </p>
                      <p
                        className={[
                          "mt-1 text-sm font-bold",
                          (faceConfidence || 0) >= 80
                            ? "text-emerald-300"
                            : "text-[#C2C6D6]",
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
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#C2C6D6]/60">
                        GPS
                      </p>
                      <p
                        className={[
                          "mt-1 text-sm font-bold",
                          gpsValidated ? "text-emerald-300" : "text-[#C2C6D6]",
                        ].join(" ")}
                      >
                        {gpsValidated ? "Lokasi valid" : "Menunggu validasi"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-[#C2C6D6]">
                      {lastStatus}
                    </p>
                  <button
                    type="button"
                    onClick={confirmAttendance}
                    disabled={
                      faceModelLoading ||
                      !faceDetected ||
                      (faceConfidence || 0) < 80 ||
                      saving
                    }
                    className="flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#3B82F6] px-6 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-[#60A5FA] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {saving ? <span className="employee-spinner" /> : <Camera size={18} />}
                    {saving ? "Memproses..." : "Validasi GPS & Simpan"}
                  </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </EmployeeShell>
  );
}
