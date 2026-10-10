/**
 * Tiny, crash-proof wrapper around localStorage.
 * Every read/write is guarded: private windows and blocked storage just behave like
 * an empty store. Never put documents in here — only answers and results.
 */

export const STORAGE_KEYS = {
  geminiKey: "admitlens:byok-gemini-key",
  theme: "admitlens:theme",
  wizard: "admitlens:wizard-answers",
  shortlist: "admitlens:shortlist",
  sopForm: "admitlens:sop-form",
} as const;

const EVENT = "admitlens:storage";

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — the app still works, it just won't remember.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

export function readJSON<T>(key: string, fallback: T): T {
  const raw = readStorage(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  writeStorage(key, JSON.stringify(value));
}

/** Subscribe to changes from this tab (custom event) and other tabs (storage event). */
export function subscribeStorage(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
