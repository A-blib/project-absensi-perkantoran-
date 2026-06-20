const NOTIFICATION_STORAGE_KEY = "employee-notifications-v1";
const NOTIFICATION_EVENT = "employee-notifications-updated";
const NOTIFICATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getNotificationStorageKey(ownerKey) {
  return ownerKey
    ? `employee-notifications-${ownerKey}`
    : NOTIFICATION_STORAGE_KEY;
}

const defaultNotifications = [
  {
    id: "notif-absensi-success-default",
    title: "Absensi berhasil",
    message: "Absensi masuk tercatat pukul 08:00:22 WIB.",
    category: "absensi",
    type: "success",
    isRead: false,
    createdAt: "2026-06-12T01:00:00.000Z",
  },
  {
    id: "notif-absensi-late-default",
    title: "Terlambat masuk",
    message: "Kamu terlambat 14 menit pada 04/06/2026.",
    category: "absensi",
    type: "warning",
    isRead: false,
    createdAt: "2026-06-11T01:00:00.000Z",
  },
  {
    id: "notif-izin-approved-default",
    title: "Izin disetujui",
    message: "Pengajuan sakit tanggal 28/05/2026 disetujui admin.",
    category: "izin",
    type: "success",
    isRead: true,
    createdAt: "2026-06-05T01:00:00.000Z",
  },
  {
    id: "notif-izin-rejected-default",
    title: "Izin ditolak",
    message: "Pengajuan izin tanggal 22/05/2026 perlu revisi alasan.",
    category: "izin",
    type: "danger",
    isRead: true,
    createdAt: "2026-05-29T01:00:00.000Z",
  },
];

function isFreshNotification(notification) {
  const createdAt = new Date(notification.createdAt).getTime();
  if (!Number.isFinite(createdAt)) return false;
  return Date.now() - createdAt < NOTIFICATION_MAX_AGE_MS;
}

function sortByNewest(notifications) {
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function dedupeNotifications(notifications) {
  const byId = new Map();
  sortByNewest(notifications).filter(isFreshNotification).forEach((notification) => {
    if (!byId.has(notification.id)) byId.set(notification.id, notification);
  });
  return Array.from(byId.values());
}

function notifySubscribers(ownerKey) {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENT, {
      detail: { ownerKey },
    }),
  );
}

function showBrowserNotification(notification) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(notification.title, {
      body: notification.message,
      tag: notification.id,
      silent: true,
    });
  } catch {
    // Browser notifications are optional; the in-app notification is enough.
  }
}

function writeNotifications(notifications, ownerKey) {
  window.localStorage.setItem(
    getNotificationStorageKey(ownerKey),
    JSON.stringify(dedupeNotifications(notifications)),
  );
  notifySubscribers(ownerKey);
}

export function readEmployeeNotifications(ownerKey) {
  if (typeof window === "undefined") return defaultNotifications;

  try {
    const value = window.localStorage.getItem(getNotificationStorageKey(ownerKey));
    if (!value) {
      writeNotifications(defaultNotifications, ownerKey);
      return dedupeNotifications(defaultNotifications);
    }

    const notifications = JSON.parse(value);
    const nextNotifications = Array.isArray(notifications)
      ? dedupeNotifications(notifications)
      : [];
    return nextNotifications;
  } catch {
    return dedupeNotifications(defaultNotifications);
  }
}

export function createEmployeeNotification(input, ownerKey) {
  if (typeof window === "undefined") return [];

  const currentNotifications = readEmployeeNotifications(ownerKey);
  const notification = {
    id: input.id || `notification-${Date.now()}`,
    title: input.title,
    message: input.message,
    category: input.category,
    type: input.type || "info",
    isRead: false,
    createdAt: input.createdAt || new Date().toISOString(),
  };
  const nextNotifications = dedupeNotifications([
    notification,
    ...currentNotifications.filter((item) => item.id !== notification.id),
  ]).slice(0, 50);
  writeNotifications(nextNotifications, ownerKey);
  showBrowserNotification(notification);
  return nextNotifications;
}

export function syncEmployeeNotifications(
  generatedNotifications,
  shouldRemove,
  ownerKey,
) {
  if (typeof window === "undefined") return [];

  const current = readEmployeeNotifications(ownerKey);
  const currentById = new Map(
    current.map((notification) => [notification.id, notification]),
  );
  const mergedGeneratedNotifications = generatedNotifications.map((notification) => ({
    ...notification,
    isRead: currentById.get(notification.id)?.isRead ?? notification.isRead,
  }));
  const generatedIds = new Set(
    mergedGeneratedNotifications.map((notification) => notification.id),
  );
  const currentNotifications = current
    .filter((notification) => !generatedIds.has(notification.id))
    .filter((notification) => !shouldRemove?.(notification));
  const nextNotifications = dedupeNotifications([
    ...mergedGeneratedNotifications,
    ...currentNotifications,
  ]).slice(0, 50);
  writeNotifications(nextNotifications, ownerKey);
  return nextNotifications;
}

export function markEmployeeNotificationRead(id, ownerKey) {
  if (typeof window === "undefined") return [];

  const nextNotifications = readEmployeeNotifications(ownerKey).map((notification) =>
    notification.id === id ? { ...notification, isRead: true } : notification,
  );
  writeNotifications(nextNotifications, ownerKey);
  return nextNotifications;
}

export function markAllEmployeeNotificationsRead(ownerKey) {
  if (typeof window === "undefined") return [];

  const nextNotifications = readEmployeeNotifications(ownerKey).map((notification) => ({
    ...notification,
    isRead: true,
  }));
  writeNotifications(nextNotifications, ownerKey);
  return nextNotifications;
}

export function requestEmployeeNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

export function getEmployeeUnreadNotificationCount(ownerKey) {
  return readEmployeeNotifications(ownerKey).filter((notification) => !notification.isRead)
    .length;
}

export { NOTIFICATION_EVENT as employeeNotificationEvent };
