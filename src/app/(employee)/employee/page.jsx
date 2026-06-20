"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Fingerprint,
  LogIn,
  LogOut,
  MapPinned,
  ScanFace,
  ShieldCheck,
  Sun,
  Trash2,
  XCircle,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { useCurrentUser } from "@/lib/browser/use-current-user";
import {
  readEmployeeAttendanceRecords,
} from "@/lib/browser/employee-attendance-store";

const summaryCardMeta = {
  attendance: {
    label: "Kehadiran",
    icon: CheckCircle2,
    tone: "emerald",
  },
  permission: {
    label: "Izin",
    icon: CalendarX,
    tone: "primary",
  },
  late: {
    label: "Telat",
    icon: Clock3,
    tone: "warning",
  },
  leave: {
    label: "Cuti",
    icon: CalendarDays,
    tone: "leave",
  },
};

const defaultWeeklySchedule = [
  { dayIndex: 1, day: "SEN", shift: "REGULER" },
  { dayIndex: 2, day: "SEL", shift: "REGULER" },
  { dayIndex: 3, day: "RAB", shift: "REGULER" },
  { dayIndex: 4, day: "KAM", shift: "REGULER" },
  { dayIndex: 5, day: "JUM", shift: "REGULER" },
];

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

  if (tone === "warning") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  if (tone === "danger") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  if (tone === "violet") {
    return "border-violet-500/20 bg-violet-500/10 text-violet-300";
  }

  return "border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[#3B82F6]";
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

function formatScheduleDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDisplayDate(value) {
  if (!value || typeof value !== "string") return null;

  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return null;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function getRecordDateKey(record) {
  return record?.dateKey || parseDisplayDate(record?.date);
}

function normalizeEmployeeAttendanceStatus(record) {
  const status = record?.statusKey || record?.status || "";
  const lowered = String(status).toLowerCase();

  if (lowered.includes("terlambat") || lowered === "telat") return "telat";
  if (lowered.includes("izin")) return "izin";
  if (lowered.includes("alpa")) return "alpa";
  return "hadir";
}

function getCurrentMonthRange() {
  const today = getJakartaDate();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    startKey: formatScheduleDate(startDate),
    endKey: formatScheduleDate(endDate),
    label: today.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }),
  };
}

function isDateKeyInRange(dateKey, startKey, endKey) {
  return Boolean(dateKey && dateKey >= startKey && dateKey <= endKey);
}

function addDateRangeToSet(targetSet, startKey, endKey, monthStartKey, monthEndKey) {
  if (!startKey) return;

  const firstKey = startKey < monthStartKey ? monthStartKey : startKey;
  const lastKey = (endKey || startKey) > monthEndKey ? monthEndKey : endKey || startKey;

  if (firstKey > lastKey) return;

  const current = new Date(`${firstKey}T00:00:00+07:00`);
  const last = new Date(`${lastKey}T00:00:00+07:00`);

  while (current <= last) {
    targetSet.add(formatScheduleDate(current));
    current.setDate(current.getDate() + 1);
  }
}

function isApprovedLeave(request) {
  return request?.status === "Disetujui";
}

function isAnnualLeave(request) {
  return String(request?.type || "").toLowerCase() === "cuti";
}

function formatActivityDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function getRelativeActivityTime(value) {
  if (!value) return "";

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;

  return formatActivityDate(value);
}

function getActivityIcon(activity) {
  if (activity.action === "check_in") {
    return activity.tone === "warning" ? Clock3 : CheckCircle2;
  }

  if (activity.action === "check_out") return LogOut;
  if (activity.action === "submitted") return FilePenLine;
  if (activity.tone === "danger") return XCircle;
  return CheckCircle2;
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

function buildWeeklySchedule(workHours = DEFAULT_ATTENDANCE_CONFIG.workHours) {
  const today = getJakartaDate();
  const todayKey = formatScheduleDate(today);
  const weekStart = getWeekStart(today);
  const shiftLabel = workHours.shiftName || "REGULER";
  const startTime = workHours.startTime || "08:00";
  const endTime = workHours.endTime || "17:00";

  return defaultWeeklySchedule.map((schedule) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + schedule.dayIndex - 1);
    const dateKey = formatScheduleDate(date);

    return {
      ...schedule,
      start: startTime,
      end: endTime,
      shift: shiftLabel,
      date: dateKey,
      isToday: dateKey === todayKey,
    };
  });
}

function getClockLabel(value) {
  if (!value || value === "--:--:--") return null;
  return value.includes("WIB") ? value : `${value} WIB`;
}

function getFallbackTodayAttendance(locationLabel = "Kantor Pusat") {
  const today = getTodayDate();
  return {
    date: today,
    clockIn: null,
    clockOut: null,
    status: "Belum Absen",
    location: locationLabel,
    gpsValid: false,
    faceVerified: false,
    faceConfidence: null,
  };
}

function getEmployeeTitle(user) {
  return user?.position || user?.division || "Pegawai";
}

function getStoredTodayAttendance(ownerKey, fallbackLocation) {
  const today = getTodayDate();
  const record = readEmployeeAttendanceRecords(ownerKey).find(
    (item) => item.date === today,
  );

  if (!record) return null;

  return {
    date: today,
    clockIn: getClockLabel(record.clockIn),
    clockOut: getClockLabel(record.clockOut),
    status: record.status || "Hadir",
    location: record.location || fallbackLocation,
    gpsValid:
      record.distance && record.radius
        ? Number(record.distance) <= Number(record.radius)
        : true,
    faceVerified: true,
    faceConfidence: 98,
  };
}

export default function EmployeeHomePage() {
  const { user } = useCurrentUser();
  const ownerKey = user?.id;
  const employeeName = user?.name || "Pegawai";
  const employeeTitle = getEmployeeTitle(user);
  const [clock, setClock] = useState("--:--:--");
  const [attendanceConfig, setAttendanceConfig] = useState(
    DEFAULT_ATTENDANCE_CONFIG,
  );
  const [todayAttendance, setTodayAttendance] = useState(
    getFallbackTodayAttendance,
  );
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [activities, setActivities] = useState([]);
  const [deletingActivityId, setDeletingActivityId] = useState(null);
  const [weeklySchedule, setWeeklySchedule] = useState(() => buildWeeklySchedule());
  const [currentMonth, setCurrentMonth] = useState(() => getCurrentMonthRange());
  const officeLocation = useMemo(
    () => toOfficeLocation(attendanceConfig),
    [attendanceConfig],
  );

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
      setWeeklySchedule(buildWeeklySchedule(attendanceConfig.workHours));
      setCurrentMonth(getCurrentMonthRange());
    }, 60000);

    return () => clearInterval(timer);
  }, [attendanceConfig.workHours]);

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
          setWeeklySchedule(buildWeeklySchedule(payload.config.workHours));
          setTodayAttendance((current) => ({
            ...current,
            location: current.clockIn ? current.location : payload.config.location.name,
          }));
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
    let active = true;

    async function loadActivities() {
      try {
        const response = await fetch("/api/employee/activities", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = await response.json();
        if (active) {
          setActivities(Array.isArray(payload.activities) ? payload.activities : []);
        }
      } catch {
        if (active) setActivities([]);
      }
    }

    loadActivities();
    const refreshTimer = setInterval(loadActivities, 60000);
    window.addEventListener("focus", loadActivities);

    return () => {
      active = false;
      clearInterval(refreshTimer);
      window.removeEventListener("focus", loadActivities);
    };
  }, []);

  const updateGpsStatus = useCallback((valid) => {
    setTodayAttendance((current) => ({
      ...current,
      gpsValid: valid,
    }));
  }, []);

  // Kirim lokasi real-time ke server saat karyawan buka dashboard dan belum absen
  useEffect(() => {
    let active = true;
    let intervalId = null;

    function sendLocation() {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!active) return;
          fetch("/api/employee/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
      );
    }

    // Hanya kirim jika belum ada check-in
    if (!todayAttendance.clockIn) {
      sendLocation();
      intervalId = setInterval(sendLocation, 3 * 60 * 1000); // update tiap 3 menit
    } else {
      // Hapus lokasi saat sudah absen
      fetch("/api/employee/location", { method: "DELETE" }).catch(() => {});
    }

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [todayAttendance.clockIn]);

  const checkGpsReachability = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        updateGpsStatus(false);
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

          updateGpsStatus(valid);
          resolve(valid);
        },
        () => {
          updateGpsStatus(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, [officeLocation, updateGpsStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkGpsReachability();
    }, 0);

    return () => clearTimeout(timer);
  }, [checkGpsReachability]);

  useEffect(() => {
    let active = true;

    async function loadTodayAttendance() {
      try {
        const response = await fetch("/api/employee/attendance", {
          cache: "no-store",
        });

        if (response.ok) {
          const payload = await response.json();
          if (active) {
            setAttendanceRecords(
              Array.isArray(payload.records) ? payload.records : [],
            );
          }

          if (active && payload.today) {
            setTodayAttendance({
              date: payload.today.date,
              clockIn: getClockLabel(payload.today.clockIn),
              clockOut:
                payload.today.clockOut === "--:--:--"
                  ? null
                  : getClockLabel(payload.today.clockOut),
              status: payload.today.status,
              location: payload.today.location || officeLocation.label,
              gpsValid: true,
              faceVerified: payload.today.faceVerified,
              faceConfidence: payload.today.faceConfidence,
            });
            return;
          }
        }
      } catch {
        // Use local fallback below when the server is unavailable.
      }

      const storedAttendance = getStoredTodayAttendance(ownerKey, officeLocation.label);
      if (active) {
        setAttendanceRecords(readEmployeeAttendanceRecords(ownerKey));
        setTodayAttendance(
          storedAttendance || getFallbackTodayAttendance(officeLocation.label),
        );
      }
    }

    loadTodayAttendance();

    return () => {
      active = false;
    };
  }, [ownerKey, officeLocation.label]);

  useEffect(() => {
    let active = true;

    async function loadLeaveRequests() {
      try {
        const response = await fetch("/api/employee/leave-requests", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = await response.json();
        if (active) {
          setLeaveRequests(Array.isArray(payload.requests) ? payload.requests : []);
        }
      } catch {
        if (active) setLeaveRequests([]);
      }
    }

    loadLeaveRequests();

    return () => {
      active = false;
    };
  }, []);

  const monthlySummaryCards = useMemo(() => {
    const presentDates = new Set();
    const lateDates = new Set();
    const permissionDates = new Set();
    const leaveDates = new Set();
    let totalLateMinutes = 0;

    attendanceRecords.forEach((record) => {
      const dateKey = getRecordDateKey(record);
      if (!isDateKeyInRange(dateKey, currentMonth.startKey, currentMonth.endKey)) {
        return;
      }

      const status = normalizeEmployeeAttendanceStatus(record);

      if (status === "hadir" || status === "telat") {
        presentDates.add(dateKey);
      }

      if (status === "telat") {
        lateDates.add(dateKey);
        totalLateMinutes += Number(record.lateMinutes || 0);
      }

      if (status === "izin") {
        permissionDates.add(dateKey);
      }
    });

    leaveRequests.filter(isApprovedLeave).forEach((request) => {
      const targetSet = isAnnualLeave(request) ? leaveDates : permissionDates;
      addDateRangeToSet(
        targetSet,
        request.startDate,
        request.endDate,
        currentMonth.startKey,
        currentMonth.endKey,
      );
    });

    const averageLateMinutes = lateDates.size
      ? Math.round(totalLateMinutes / lateDates.size)
      : 0;

    return [
      {
        ...summaryCardMeta.attendance,
        value: `${presentDates.size} Hari`,
        note: `Periode ${currentMonth.label}`,
      },
      {
        ...summaryCardMeta.permission,
        value: `${permissionDates.size} Hari`,
        note: "Izin disetujui bulan ini",
      },
      {
        ...summaryCardMeta.late,
        value: `${lateDates.size} Kali`,
        note: averageLateMinutes
          ? `Rata-rata ${averageLateMinutes} menit`
          : "Tidak ada telat bulan ini",
      },
      {
        ...summaryCardMeta.leave,
        value: `${leaveDates.size} Hari`,
        note: "Cuti disetujui bulan ini",
      },
    ];
  }, [attendanceRecords, currentMonth, leaveRequests]);

  async function handleDeleteActivity(id) {
    setDeletingActivityId(id);

    try {
      const response = await fetch(`/api/employee/activities/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) return;

      setActivities((current) => current.filter((activity) => activity.id !== id));
    } finally {
      setDeletingActivityId(null);
    }
  }

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
  const attendanceStatusLabel = attendanceCompleted
    ? "Absensi Selesai"
    : hasCheckedIn
      ? "Hadir Hari Ini"
      : "Belum Absen";
  const gpsStatus = todayAttendance.gpsValid ? "Dalam radius" : "Di luar radius";
  const gpsStatusColor = todayAttendance.gpsValid
    ? "text-emerald-400"
    : "text-red-400";
  const identityStatus = todayAttendance.faceVerified
    ? "Terverifikasi"
    : "Dicek saat absen";
  const identityStatusColor = todayAttendance.faceVerified
    ? "text-emerald-400"
    : "text-[#60A5FA]";
  const cameraStatus = "Siap di panel absensi";
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
    <EmployeeShell initialUser={user}>
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
              Selamat Pagi, {employeeName}
            </h2>
            <p className="mt-1 text-sm text-[#C2C6D6]">
              {employeeTitle} - Semoga hari kerja Anda produktif hari ini.
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
          <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
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
                Ringkasan cepat untuk melihat status masuk, keluar, lokasi, dan
                validasi sebelum membuka panel absensi.
              </p>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Check In", todayAttendance.clockIn || "Belum Absen", LogIn, "text-[#3B82F6]"],
                  ["Check Out", todayAttendance.clockOut || "Belum Absen", LogOut, "text-[#D4E4FA]"],
                  ["Lokasi", gpsStatus, MapPinned, gpsStatusColor],
                  ["Validasi Wajah", identityStatus, ScanFace, identityStatusColor],
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

              <div className="mt-4 grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)]">
                <Link
                  href="/employee/absensi"
                  className="group flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-4 text-sm font-bold text-white shadow-lg shadow-[#3B82F6]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
                >
                  <Fingerprint size={18} />
                  Buka Panel Absensi
                </Link>
                <Link
                  href="/employee/riwayat"
                  className="flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl border border-[#24344D] bg-white/[0.04] px-4 text-sm font-bold text-[#D4E4FA] transition-all hover:-translate-y-0.5 hover:border-[#3B82F6]/60 hover:bg-white/[0.06] active:scale-[0.98]"
                >
                  <ShieldCheck size={18} />
                  Riwayat
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[#24344D] bg-[#0B1220] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#8B9DB5]">
                    Kesiapan Absensi Hari Ini
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#D4E4FA]">
                    {attendanceStatusLabel}
                  </p>
                </div>
                <div className="grid size-12 place-items-center rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[#3B82F6]">
                  <Fingerprint size={24} />
                </div>
              </div>

              <div className="mt-4 grid gap-2.5">
                {[
                  ["Status hari ini", attendanceStatusLabel, CheckCircle2, hasCheckedIn ? "text-emerald-400" : "text-[#60A5FA]"],
                  ["Lokasi saat ini", gpsStatus, MapPinned, gpsStatusColor],
                  ["Kamera", cameraStatus, Fingerprint, "text-[#60A5FA]"],
                  ["Validasi wajah", identityStatus, ScanFace, identityStatusColor],
                ].map(([label, value, Icon, color]) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl border border-[#24344D] bg-white/[0.04] px-3 py-2.5"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.05]">
                      <Icon size={17} className={color} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B9DB5]">
                        {label}
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-[#D4E4FA]">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#D4E4FA]">Ringkasan Cepat</h3>
            <span className="text-sm font-medium text-[#C2C6D6]">
              {currentMonth.label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {monthlySummaryCards.map((card) => {
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
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#D4E4FA]">
                Aktivitas Terbaru
              </h3>
              <p className="mt-1 text-sm text-[#C2C6D6]">
                Riwayat aktivitas akun ini tersimpan di database.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#8B9DB5]">
              {activities.length} aktivitas
            </span>
          </div>
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity);

              return (
                <div
                  key={activity.id}
                  className="flex gap-3 rounded-xl border border-[#24344D] bg-white/[0.04] p-4 transition hover:border-[#3B82F6]/35 sm:gap-4"
                >
                  <div
                    className={[
                      "grid size-10 shrink-0 place-items-center rounded-xl border",
                      getActivityTone(activity.tone),
                    ].join(" ")}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <p className="font-bold text-[#D4E4FA]">{activity.title}</p>
                      <span className="shrink-0 text-[11px] text-[#C2C6D6]">
                        {getRelativeActivityTime(activity.occurredAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#C2C6D6]">
                      {activity.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteActivity(activity.id)}
                    disabled={deletingActivityId === activity.id}
                    className="grid size-9 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 transition hover:bg-red-500/15 disabled:cursor-wait disabled:opacity-55"
                    aria-label={`Hapus aktivitas ${activity.title}`}
                    title="Hapus aktivitas"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}

            {!activities.length ? (
              <div className="rounded-xl border border-dashed border-[#24344D] bg-white/[0.03] p-5 text-sm leading-6 text-[#C2C6D6]">
                Belum ada aktivitas absensi atau pengajuan yang tercatat untuk
                akun ini.
              </div>
            ) : null}
          </div>
        </section>
      </div>

    </EmployeeShell>
  );
}
