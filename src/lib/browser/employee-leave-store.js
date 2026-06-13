const LEAVE_STORAGE_KEY = "employee-leave-requests-v1";

function getLeaveStorageKey(ownerKey) {
  return ownerKey ? `employee-leave-requests-${ownerKey}` : LEAVE_STORAGE_KEY;
}

export function readEmployeeLeaveRequests(ownerKey) {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(getLeaveStorageKey(ownerKey));
    const requests = value ? JSON.parse(value) : [];
    return Array.isArray(requests) ? requests : [];
  } catch {
    return [];
  }
}

export function saveEmployeeLeaveRequest(request, ownerKey) {
  if (typeof window === "undefined") return [];

  const requests = readEmployeeLeaveRequests(ownerKey);
  const nextRequests = [request, ...requests].slice(0, 20);
  window.localStorage.setItem(getLeaveStorageKey(ownerKey), JSON.stringify(nextRequests));
  return nextRequests;
}
