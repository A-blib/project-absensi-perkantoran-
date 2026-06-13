"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  Info,
  Search,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { useCurrentUser } from "@/lib/browser/use-current-user";
import {
  markAllEmployeeNotificationsRead,
  markEmployeeNotificationRead,
  readEmployeeNotifications,
  syncEmployeeNotifications,
} from "@/lib/browser/employee-notification-store";
import { readEmployeeAttendanceRecords } from "@/lib/browser/employee-attendance-store";

const categories = [
  { label: "Semua", value: "semua" },
  { label: "Absensi", value: "absensi" },
  { label: "Izin", value: "izin" },
  { label: "Info", value: "info" },
];

const toneClasses = {
  success: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  warning: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  info: "bg-sky-400/10 text-sky-300 border-sky-400/20",
  danger: "bg-red-400/10 text-red-300 border-red-400/20",
};

const categoryLabels = {
  absensi: "Absensi",
  izin: "Izin",
  info: "Info",
};

const typeIcons = {
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: XCircle,
  info: Info,
};

function getRelativeTime(value) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function getCategoryCount(notifications, category) {
  if (category === "semua") return notifications.length;
  return notifications.filter((item) => item.category === category).length;
}

function getSummary(notifications) {
  return {
    total: notifications.length,
    unread: notifications.filter((item) => !item.isRead).length,
    read: notifications.filter((item) => item.isRead).length,
  };
}

function parseSavedAt(value) {
  if (!value) return new Date().toISOString();

  const [datePart, timePart = "00.00.00"] = value.split(", ");
  const [day, month, year] = datePart.split("/");
  const normalizedTime = timePart.replaceAll(".", ":");
  return new Date(`${year}-${month}-${day}T${normalizedTime}+07:00`).toISOString();
}

function getAttendanceNotifications(ownerKey) {
  const latestRecordByDate = new Map();
  readEmployeeAttendanceRecords(ownerKey).forEach((record) => {
    if (!record.date) return;
    const current = latestRecordByDate.get(record.date);
    if (
      !current ||
      new Date(parseSavedAt(record.savedAt)).getTime() >
        new Date(parseSavedAt(current.savedAt)).getTime()
    ) {
      latestRecordByDate.set(record.date, record);
    }
  });

  return Array.from(latestRecordByDate.values()).flatMap((record) => {
    const notifications = [];
    const dateKey = record.date?.replaceAll("/", "-") || record.id;

    if (record.clockIn && record.clockIn !== "--:--:--") {
      notifications.push({
        id: `attendance-in-${dateKey}`,
        title:
          record.status === "Terlambat"
            ? "Terlambat masuk"
            : "Absensi berhasil",
        message:
          record.status === "Terlambat"
            ? `Absensi masuk tercatat pukul ${record.clockIn} WIB dengan status terlambat.`
            : `Absensi masuk tercatat pukul ${record.clockIn} WIB.`,
        category: "absensi",
        type: record.status === "Terlambat" ? "warning" : "success",
        isRead: false,
        createdAt: parseSavedAt(record.savedAt),
      });
    }

    if (record.clockOut && record.clockOut !== "--:--:--") {
      notifications.push({
        id: `attendance-out-${dateKey}`,
        title: "Absensi keluar berhasil",
        message: `Absensi keluar tercatat pukul ${record.clockOut} WIB.`,
        category: "absensi",
        type: "success",
        isRead: false,
        createdAt: parseSavedAt(record.savedAt),
      });
    }

    return notifications;
  });
}

export default function EmployeeNotificationsPage() {
  const { user } = useCurrentUser();
  const ownerKey = user?.id;
  const [activeCategory, setActiveCategory] = useState("semua");
  const [notificationsData, setNotificationsData] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const attendanceNotifications = getAttendanceNotifications(ownerKey);
      setNotificationsData(
        syncEmployeeNotifications(
          attendanceNotifications,
          (notification) => notification.category === "absensi",
          ownerKey,
        ),
      );
    }, 0);

    return () => clearTimeout(timer);
  }, [ownerKey]);

  const notifications = useMemo(() => {
    return notificationsData.filter((item) => {
      const matchesCategory =
        activeCategory === "semua" || item.category === activeCategory;
      const matchesQuery = `${item.title} ${item.message}`
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, notificationsData, query]);
  const summary = getSummary(notificationsData);

  function handleMarkAllRead() {
    setNotificationsData(markAllEmployeeNotificationsRead(ownerKey));
  }

  function handleOpenNotification(id) {
    setNotificationsData(markEmployeeNotificationRead(id, ownerKey));
  }

  return (
    <EmployeeShell initialUser={user}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-[#8B9DB5]">Notification center</p>
          <h2 className="mt-1 text-2xl font-bold text-[#d4e4fa]">
            Pusat Notifikasi
          </h2>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#3b82f6] px-5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-[#60a5fa]"
        >
          <BellRing size={18} />
          Tandai Semua Dibaca
        </button>
      </div>

      <section className="mb-6 grid gap-3 md:grid-cols-3">
        {[
          ["Total Notifikasi", summary.total],
          ["Belum Dibaca", summary.unread],
          ["Sudah Dibaca", summary.read],
        ].map(([label, value]) => (
          <div key={label} className="glass-panel rounded-2xl p-5">
            <p className="text-sm text-[#8B9DB5]">{label}</p>
            <p className="mt-2 text-3xl font-bold text-[#d4e4fa]">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="glass-panel rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#c2c6d6]">
            <Filter size={18} className="text-[#60a5fa]" />
            Filter Kategori
          </div>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => setActiveCategory(category.value)}
                className={[
                  "flex min-h-11 w-full items-center justify-between rounded-2xl px-4 text-left text-sm font-semibold transition",
                  activeCategory === category.value
                    ? "bg-[#3b82f6] text-white"
                    : "text-[#c2c6d6] hover:bg-[#0B1220]",
                ].join(" ")}
              >
                {category.label}
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs">
                  {getCategoryCount(notificationsData, category.value)}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="glass-panel rounded-3xl p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B9DB5]"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari notifikasi"
                className="min-h-12 w-full rounded-2xl border border-[#24344D] bg-[#0B1220] pl-11 pr-4 text-sm text-[#d4e4fa] outline-none transition placeholder:text-[#64748b] focus:border-[#3b82f6]"
              />
            </div>
            <p className="text-sm text-[#8B9DB5]">
              {notifications.length} notifikasi ditemukan
            </p>
          </div>

          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || Info;

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleOpenNotification(notification.id)}
                  className="w-full rounded-3xl border border-[#24344D] bg-[#0B1220] p-4 text-left transition hover:-translate-y-1 hover:border-[#3b82f6]/60"
                >
                  <div className="flex gap-4">
                    <div
                      className={[
                        "grid size-12 shrink-0 place-items-center rounded-2xl border",
                        toneClasses[notification.type] || toneClasses.info,
                      ].join(" ")}
                    >
                      <Icon size={21} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-[#d4e4fa]">
                          {notification.title}
                        </h3>
                        {!notification.isRead ? (
                          <span className="size-2 rounded-full bg-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,.85)]" />
                        ) : null}
                        <span className="rounded-full bg-[#132238] px-3 py-1 text-xs font-semibold text-[#8B9DB5]">
                          {categoryLabels[notification.category] || "Info"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#c2c6d6]">
                        {notification.message}
                      </p>
                      <p className="mt-3 text-xs text-[#8B9DB5]">
                        {getRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
            {!notifications.length ? (
              <div className="rounded-3xl border border-[#24344D] bg-[#0B1220] p-8 text-center">
                <p className="font-semibold text-[#d4e4fa]">
                  Tidak ada notifikasi
                </p>
                <p className="mt-2 text-sm text-[#8B9DB5]">
                  Coba ubah filter atau kata kunci pencarian.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </EmployeeShell>
  );
}
