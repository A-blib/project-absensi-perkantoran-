const LEGACY_ATTENDANCE_STORAGE_KEYS = ["employee-attendance-demo-records"];
const ATTENDANCE_STORAGE_KEY = "employee-attendance-records-empty-v1";

function clearLegacyAttendanceRecords() {
  LEGACY_ATTENDANCE_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export function readEmployeeAttendanceRecords() {
  if (typeof window === "undefined") return [];

  try {
    clearLegacyAttendanceRecords();
    const value = window.localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    const records = value ? JSON.parse(value) : [];
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

export function saveEmployeeAttendanceRecord(record) {
  if (typeof window === "undefined") return [];

  const records = readEmployeeAttendanceRecords();
  const nextRecords = [record, ...records].slice(0, 20);
  window.localStorage.setItem(
    ATTENDANCE_STORAGE_KEY,
    JSON.stringify(nextRecords),
  );
  return nextRecords;
}

export function saveEmployeeAttendanceByType(type, record) {
  if (typeof window === "undefined") return [];

  const records = readEmployeeAttendanceRecords();
  const todayIndex = records.findIndex((item) => item.date === record.date);

  if (type === "keluar" && todayIndex >= 0) {
    const nextRecords = [...records];
    nextRecords[todayIndex] = {
      ...nextRecords[todayIndex],
      clockOut: record.clockOut,
      outPhoto: record.photo,
      photo: record.photo || nextRecords[todayIndex].photo,
      savedAt: record.savedAt,
      location: record.location,
    };
    window.localStorage.setItem(
      ATTENDANCE_STORAGE_KEY,
      JSON.stringify(nextRecords),
    );
    return nextRecords;
  }

  return saveEmployeeAttendanceRecord(record);
}
