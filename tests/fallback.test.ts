import { describe, expect, it, vi } from "vitest";
import { mockResumeReview } from "@/lib/ai/mock";
import {
  AllProvidersFailedError,
  extractJson,
  ProviderHttpError,
  runWithFallback,
  type AIProvider,
} from "@/lib/ai/runner";
import { resumeReviewSchema } from "@/lib/schemas";
import { resumeRequest } from "./fixtures/requests";

const VALID = JSON.stringify(mockResumeReview(resumeRequest));

function provider(name: string, ...replies: Array<string | Error | "hang">): AIProvider & { calls: string[] } {
  const calls: string[] = [];
  let i = 0;
  return {
    name,
    calls,
    call: vi.fn(async ({ user, signal }) => {
      calls.push(user);
      const r = replies[Math.min(i++, replies.length - 1)];
      if (r === "hang") {
        return new Promise<string>((_, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
      }
      if (r instanceof Error) throw r;
      return r!;
    }),
  };
}

const run = (providers: AIProvider[], timeoutMs = 1000) =>
  runWithFallback({ providers, schema: resumeReviewSchema, system: "sys", user: "user", timeoutMs });

describe("AI fallback logic", () => {
  it("uses the primary provider when it succeeds", async () => {
    const gemini = provider("gemini", VALID);
    const groq = provider("groq", VALID);
    const res = await run([gemini, groq]);
    expect(res.provider).toBe("gemini");
    expect(groq.calls).toHaveLength(0);
  });

  it.each([429, 500, 503])("falls back on HTTP %i", async (status) => {
    const gemini = provider("gemini", new ProviderHttpError("gemini", status));
    const groq = provider("groq", VALID);
    const res = await run([gemini, groq]);
    expect(res.provider).toBe("groq");
    expect(gemini.calls).toHaveLength(1); // no pointless retry on HTTP errors
    expect(res.attempts[0]).toMatchObject({ provider: "gemini", outcome: "http-error", status });
  });

  it("falls back on timeout", async () => {
    const gemini = provider("gemini", "hang");
    const groq = provider("groq", VALID);
    const res = await run([gemini, groq], 50);
    expect(res.provider).toBe("groq");
    expect(res.attempts[0]?.outcome).toBe("timeout");
  });

  it("retries once with the validation error, then succeeds", async () => {
    const gemini = provider("gemini", '{"band":"Maybe"}', VALID);
    const res = await run([gemini, provider("groq", VALID)]);
    expect(res.provider).toBe("gemini");
    expect(gemini.calls).toHaveLength(2);
    expect(gemini.calls[1]).toContain("YOUR PREVIOUS REPLY WAS INVALID");
    expect(gemini.calls[1]).toContain("band");
  });

  it("falls back after invalid JSON twice", async () => {
    const gemini = provider("gemini", "not json at all", "still not json");
    const groq = provider("groq", VALID);
    const res = await run([gemini, groq]);
    expect(gemini.calls).toHaveLength(2);
    expect(res.provider).toBe("groq");
  });

  it("throws AllProvidersFailedError when both fail", async () => {
    const gemini = provider("gemini", new ProviderHttpError("gemini", 429));
    const groq = provider("groq", new ProviderHttpError("groq", 503));
    await expect(run([gemini, groq])).rejects.toBeInstanceOf(AllProvidersFailedError);
  });

  it("rejects output that contains a percentage chance", async () => {
    const withPercent = JSON.stringify({ ...JSON.parse(VALID), bandExplanation: "You have a 70% chance." });
    const gemini = provider("gemini", withPercent, withPercent);
    const groq = provider("groq", VALID);
    const res = await run([gemini, groq]);
    expect(res.provider).toBe("groq");
  });

  it("extracts JSON from code fences", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Here you go: {"a":2} hope it helps')).toEqual({ a: 2 });
  });
});
