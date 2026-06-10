const LEAVE_STORAGE_KEY = "employee-leave-requests-v1";

export function readEmployeeLeaveRequests() {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(LEAVE_STORAGE_KEY);
    const requests = value ? JSON.parse(value) : [];
    return Array.isArray(requests) ? requests : [];
  } catch {
    return [];
  }
}

export function saveEmployeeLeaveRequest(request) {
  if (typeof window === "undefined") return [];

  const requests = readEmployeeLeaveRequests();
  const nextRequests = [request, ...requests].slice(0, 20);
  window.localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(nextRequests));
  return nextRequests;
}
