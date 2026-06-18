const LEGACY_ATTENDANCE_STORAGE_KEYS = ["employee-attendance-demo-records"];
const ATTENDANCE_STORAGE_KEY = "employee-attendance-records-empty-v1";

function getAttendanceStorageKey(ownerKey) {
  return ownerKey
    ? `employee-attendance-records-${ownerKey}`
    : ATTENDANCE_STORAGE_KEY;
}

function clearLegacyAttendanceRecords() {
  LEGACY_ATTENDANCE_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export function readEmployeeAttendanceRecords(ownerKey) {
  if (typeof window === "undefined") return [];

  try {
    clearLegacyAttendanceRecords();
    const value = window.localStorage.getItem(getAttendanceStorageKey(ownerKey));
    const records = value ? JSON.parse(value) : [];
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

export function saveEmployeeAttendanceRecord(record, ownerKey) {
  if (typeof window === "undefined") return [];

  const records = readEmployeeAttendanceRecords(ownerKey);
  const nextRecords = [record, ...records].slice(0, 20);
  window.localStorage.setItem(
    getAttendanceStorageKey(ownerKey),
    JSON.stringify(nextRecords),
  );
  return nextRecords;
}

export function saveEmployeeAttendanceByType(type, record, ownerKey) {
  if (typeof window === "undefined") return [];

  const records = readEmployeeAttendanceRecords(ownerKey);
  const todayIndex = records.findIndex((item) => item.date === record.date);

  if (type === "keluar" && todayIndex >= 0) {
    const nextRecords = [...records];
    nextRecords[todayIndex] = {
      ...nextRecords[todayIndex],
      clockOut: record.clockOut,
      outPhoto: record.photo,
      photo: nextRecords[todayIndex].photo || record.photo,
      savedAt: record.savedAt,
      location: record.location,
      latitude: record.latitude,
      longitude: record.longitude,
      radius: record.radius,
      distance: record.distance,
      faceVerified: record.faceVerified,
      faceConfidence: record.faceConfidence,
      device: record.device,
    };
    window.localStorage.setItem(
      getAttendanceStorageKey(ownerKey),
      JSON.stringify(nextRecords),
    );
    return nextRecords;
  }

  return saveEmployeeAttendanceRecord(record, ownerKey);
}

export function clearEmployeeAttendanceByDate(date, ownerKey) {
  if (typeof window === "undefined") return [];

  const records = readEmployeeAttendanceRecords(ownerKey);
  const nextRecords = records.filter((item) => item.date !== date);
  window.localStorage.setItem(
    getAttendanceStorageKey(ownerKey),
    JSON.stringify(nextRecords),
  );
  return nextRecords;
}
