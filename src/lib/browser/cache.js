const DEFAULT_TTL_MS = 5 * 60 * 1000;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readBrowserCache(key) {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.value ?? null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function writeBrowserCache(key, value, ttlMs = DEFAULT_TTL_MS) {
  if (!isBrowser()) return;

  localStorage.setItem(
    key,
    JSON.stringify({
      value,
      expiresAt: Date.now() + ttlMs,
    }),
  );
}
