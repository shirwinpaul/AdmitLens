/**
 * Provider-agnostic "try primary, then fallback" runner.
 *
 * Per provider: call → parse JSON → validate with Zod. If the JSON is invalid, retry the
 * SAME provider once with the validation error appended. Then move on to the next provider.
 * Any provider error (429, 5xx, timeout > 40 s, network, bad key…) moves on immediately.
 * If every provider fails, AllProvidersFailedError is thrown (shown as a friendly message).
 */
import type { z } from "zod";
import { AI_CONFIG } from "@/config/ai";
import { buildRetryNote } from "@/lib/prompts";

export interface ProviderCallInput {
  system: string;
  user: string;
  signal: AbortSignal;
}

export interface AIProvider {
  name: string;
  /** Returns the raw model text (expected to be JSON). */
  call: (input: ProviderCallInput) => Promise<string>;
}

export class ProviderHttpError extends Error {
  constructor(
    public provider: string,
    public status: number,
  ) {
    super(`${provider} returned HTTP ${status}`);
  }
}

export class ProviderTimeoutError extends Error {
  constructor(public provider: string) {
    super(`${provider} timed out`);
  }
}

export class InvalidOutputError extends Error {}

export class AllProvidersFailedError extends Error {
  constructor(public attempts: AttemptLog[]) {
    super("All AI providers failed");
  }
}

/** Safe-to-log record of an attempt. Never contains document text or keys. */
export interface AttemptLog {
  provider: string;
  outcome: "ok" | "invalid-json" | "http-error" | "timeout" | "error";
  status?: number;
}

export interface RunOptions<T> {
  providers: AIProvider[];
  schema: z.ZodType<T>;
  system: string;
  user: string;
  timeoutMs?: number;
  /** Absolute deadline (Date.now()-based) so retries never exceed the route's maxDuration. */
  deadline?: number;
}

export interface RunResult<T> {
  data: T;
  provider: string;
  attempts: AttemptLog[];
}

/** Pulls a JSON object out of model text, tolerating ``` fences or stray prose. */
export function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    throw new InvalidOutputError("The reply was not valid JSON.");
  }
}

function describeZodError(error: z.ZodError): string {
  return error.issues
    .slice(0, 12)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

async function callWithTimeout(provider: AIProvider, input: Omit<ProviderCallInput, "signal">, timeoutMs: number) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ProviderTimeoutError(provider.name));
    }, timeoutMs);
  });
  try {
    return await Promise.race([provider.call({ ...input, signal: controller.signal }), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function runWithFallback<T>(opts: RunOptions<T>): Promise<RunResult<T>> {
  const timeoutMs = opts.timeoutMs ?? AI_CONFIG.timeoutMs;
  const attempts: AttemptLog[] = [];

  for (const provider of opts.providers) {
    let user = opts.user;
    for (let attempt = 0; attempt <= AI_CONFIG.invalidJsonRetries; attempt++) {
      const remaining = opts.deadline ? opts.deadline - Date.now() : timeoutMs;
      // Not enough time left before the route's maxDuration for a meaningful attempt.
      if (opts.deadline && remaining < 3000) throw new AllProvidersFailedError(attempts);
      try {
        const raw = await callWithTimeout(provider, { system: opts.system, user }, Math.min(timeoutMs, remaining));
        const result = opts.schema.safeParse(extractJson(raw));
        if (!result.success) throw new InvalidOutputError(describeZodError(result.error));
        attempts.push({ provider: provider.name, outcome: "ok" });
        return { data: result.data, provider: provider.name, attempts };
      } catch (err) {
        if (err instanceof InvalidOutputError) {
          attempts.push({ provider: provider.name, outcome: "invalid-json" });
          user = opts.user + buildRetryNote(err.message);
          continue; // retry same provider once, then fall through to the next one
        }
        if (err instanceof ProviderHttpError) {
          attempts.push({ provider: provider.name, outcome: "http-error", status: err.status });
        } else if (err instanceof ProviderTimeoutError) {
          attempts.push({ provider: provider.name, outcome: "timeout" });
        } else {
          attempts.push({ provider: provider.name, outcome: "error" });
        }
        break; // 429 / 5xx / timeout / other → next provider
      }
    }
  }
  throw new AllProvidersFailedError(attempts);
}
