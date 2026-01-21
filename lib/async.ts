export const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("timeout")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

type CacheEntry<T> = {
  ts: number;
  data: T;
};

export const getLocalCache = <T,>(key: string, maxAgeMs: number): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > maxAgeMs) return null;
    return parsed.data ?? null;
  } catch {
    return null;
  }
};

export const setLocalCache = <T,>(key: string, data: T): void => {
  if (typeof window === "undefined") return;
  try {
    const payload: CacheEntry<T> = { ts: Date.now(), data };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
};
