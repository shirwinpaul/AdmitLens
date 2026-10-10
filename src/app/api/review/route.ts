import { isMockMode } from "@/config/ai";
import { mockResumeReview } from "@/lib/ai/mock";
import { reviewResume } from "@/lib/ai/review";
import { aiErrorResponse, enforceRateLimit, jsonError, jsonOk, sleep, userGeminiKey } from "@/lib/api";
import { FILE_TOO_LARGE_MESSAGE, MAX_PDF_UPLOAD_BYTES } from "@/config/limits";
import { resumeRequestSchema, type ResumeReviewResponse } from "@/lib/schemas";

export const runtime = "nodejs";
/** Two providers × (call + 1 retry) can take a while; the runner also enforces a deadline. */
export const maxDuration = 120;

/**
 * POST multipart/form-data:
 *  - payload: JSON (ResumeRequest)
 *  - pdf:     optional PDF file (≤ 3 MB) for Gemini to read directly
 * Nothing is stored or logged; the document lives only in this request's memory.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request);
  if (limited) return limited;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "We couldn't read your request. Please try again.");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(String(form.get("payload") ?? ""));
  } catch {
    return jsonError(400, "We couldn't read your answers. Please go back and try again.");
  }
  const parsed = resumeRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(400, `Please check your answers: ${parsed.error.issues[0]?.message ?? "invalid input"}.`);
  }
  const req = parsed.data;

  let pdfBase64: string | undefined;
  const pdf = form.get("pdf");
  if (pdf instanceof File && pdf.size > 0) {
    if (pdf.size > MAX_PDF_UPLOAD_BYTES) return jsonError(413, FILE_TOO_LARGE_MESSAGE);
    const bytes = Buffer.from(await pdf.arrayBuffer());
    if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") return jsonError(400, "That file doesn't look like a valid PDF.");
    pdfBase64 = bytes.toString("base64");
  }

  if (!pdfBase64 && req.documentText.trim().length < 100) {
    return jsonError(400, "We couldn't find enough text in your resume. Please upload it again or paste the text.");
  }

  if (isMockMode()) {
    await sleep(1500);
    return jsonOk({ review: mockResumeReview(req), provider: "mock" } satisfies ResumeReviewResponse);
  }

  try {
    const result = await reviewResume(req, {
      userGeminiKey: userGeminiKey(request),
      pdfBase64,
      deadline: Date.now() + (maxDuration - 10) * 1000,
    });
    return jsonOk({ review: result.data, provider: result.provider } satisfies ResumeReviewResponse);
  } catch (err) {
    return aiErrorResponse("api/review", err);
  }
}
