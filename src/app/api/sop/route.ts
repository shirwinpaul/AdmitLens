import { isMockMode } from "@/config/ai";
import { mockSopReview } from "@/lib/ai/mock";
import { reviewSop } from "@/lib/ai/review";
import { aiErrorResponse, enforceRateLimit, jsonError, jsonOk, sleep, userGeminiKey } from "@/lib/api";
import { sopRequestSchema, type SopReviewResponse } from "@/lib/schemas";
import { countWords } from "@/lib/wordCount";

export const runtime = "nodejs";
export const maxDuration = 120;

/** POST JSON (SopRequest). Nothing is stored or logged. */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "We couldn't read your request. Please try again.");
  }
  const parsed = sopRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? "Please check your essay and try again.");
  }
  const req = parsed.data;
  // Word count is computed in code, never by the AI.
  const wordCount = countWords(req.essayText);

  if (isMockMode()) {
    await sleep(1500);
    return jsonOk({
      review: mockSopReview(req),
      wordCount,
      wordLimit: req.wordLimit,
      provider: "mock",
    } satisfies SopReviewResponse);
  }

  try {
    const result = await reviewSop(req, wordCount, {
      userGeminiKey: userGeminiKey(request),
      deadline: Date.now() + (maxDuration - 10) * 1000,
    });
    return jsonOk({
      review: result.data,
      wordCount,
      wordLimit: req.wordLimit,
      provider: result.provider,
    } satisfies SopReviewResponse);
  } catch (err) {
    return aiErrorResponse("api/sop", err);
  }
}
