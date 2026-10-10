import "server-only";
import { NextResponse } from "next/server";
import { AI_BUSY_MESSAGE, AI_CONFIG, isMockMode } from "@/config/ai";
import { NoProviderConfiguredError } from "@/lib/ai/review";
import { AllProvidersFailedError } from "@/lib/ai/runner";
import { aiRateLimiter, clientIp } from "@/lib/rateLimit";

const NO_STORE = { "Cache-Control": "no-store" };

export function jsonOk(body: unknown) {
  return NextResponse.json(body, { headers: NO_STORE });
}

export function jsonError(status: number, error: string, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json({ error }, { status, headers: { ...NO_STORE, ...extraHeaders } });
}

/** Returns a 429 response if this IP is over the limit (skipped in mock mode). */
export function enforceRateLimit(request: Request) {
  if (isMockMode()) return null;
  const result = aiRateLimiter.check(clientIp(request.headers));
  if (result.ok) return null;
  const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
  return jsonError(
    429,
    `You've reached the limit of ${AI_CONFIG.rateLimit.maxRequests} reviews per hour. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    { "Retry-After": String(result.retryAfterSeconds) },
  );
}

export function userGeminiKey(request: Request): string | null {
  const key = request.headers.get(AI_CONFIG.byokHeader);
  return key && key.length < 200 ? key : null;
}

/** Maps AI-layer failures to friendly responses. Logs only safe metadata — never text or keys. */
export function aiErrorResponse(route: string, err: unknown) {
  if (err instanceof NoProviderConfiguredError) {
    console.warn(`[${route}] no AI provider configured`);
    return jsonError(
      503,
      "The AI isn't set up yet. Add your free keys to .env.local (see README), or add your own Gemini key in Settings.",
    );
  }
  if (err instanceof AllProvidersFailedError) {
    console.warn(`[${route}] all providers failed`, JSON.stringify(err.attempts));
    return jsonError(503, AI_BUSY_MESSAGE);
  }
  console.error(`[${route}] unexpected error`, err instanceof Error ? err.name : typeof err);
  return jsonError(500, AI_BUSY_MESSAGE);
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
