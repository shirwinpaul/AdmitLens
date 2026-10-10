/**
 * Per-IP sliding-window rate limit, kept in memory.
 * Best-effort only: on serverless platforms each instance has its own memory, so the
 * limit is per instance and resets on cold starts (see README).
 */
import { AI_CONFIG } from "@/config/ai";

export interface RateLimiter {
  check: (key: string, now?: number) => { ok: boolean; retryAfterSeconds: number; remaining: number };
}

export function createRateLimiter(
  maxRequests: number = AI_CONFIG.rateLimit.maxRequests,
  windowMs: number = AI_CONFIG.rateLimit.windowMs,
): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    check(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= maxRequests) {
        hits.set(key, recent);
        return { ok: false, retryAfterSeconds: Math.ceil((recent[0] + windowMs - now) / 1000), remaining: 0 };
      }
      recent.push(now);
      hits.set(key, recent);
      // Keep memory bounded on long-lived instances.
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
      }
      return { ok: true, retryAfterSeconds: 0, remaining: maxRequests - recent.length };
    },
  };
}

/** One shared limiter for all AI routes. */
export const aiRateLimiter = createRateLimiter();

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
