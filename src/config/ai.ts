/**
 * Single source of truth for every AI provider setting.
 * Model IDs checked against the official docs (Oct 2026):
 *  - Gemini: https://ai.google.dev/gemini-api/docs/models (free tier: see /pricing)
 *  - Groq:   https://console.groq.com/docs/models
 * Change a model here and the whole app follows.
 */
export const AI_CONFIG = {
  gemini: {
    /** Primary model. Flash-class, free tier, reads PDFs natively. */
    model: "gemini-3.8-flash",
    envKey: "GEMINI_API_KEY",
    temperature: 0.4,
  },
  groq: {
    /** Fallback model. Text-only, so it uses the text extracted in the browser. */
    model: "llama-3.3-70b-versatile",
    envKey: "GROQ_API_KEY",
    temperature: 0.4,
    maxTokens: 8000,
  },
  /** A provider call slower than this counts as a failure and triggers the fallback. */
  timeoutMs: 40_000,
  /** Retries per provider when the JSON is invalid (validation error is appended). */
  invalidJsonRetries: 1,
  rateLimit: {
    maxRequests: 15,
    windowMs: 60 * 60 * 1000,
  },
  /** Header used to send a user's own (BYOK) Gemini key per request. */
  byokHeader: "x-user-gemini-key",
} as const;

/** Text shown whenever every provider fails. */
export const AI_BUSY_MESSAGE =
  "Our free AI is busy — try again in a minute, or add your own free Gemini key in Settings.";

/** Placeholder values from .env.example count as "no key". */
export function isRealKey(value: string | undefined | null): value is string {
  if (!value) return false;
  const v = value.trim();
  return v.length > 10 && !v.startsWith("PASTE_YOUR_");
}

/** Mock mode is for local development only — never active in production builds. */
export function isMockMode(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.MOCK_AI === "true";
}
