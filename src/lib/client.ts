/**
 * Browser-side API helpers. Never throw — always return a friendly result.
 */
import { AI_BUSY_MESSAGE, AI_CONFIG } from "@/config/ai";
import { FILE_TOO_LARGE_MESSAGE, MAX_PDF_UPLOAD_BYTES } from "@/config/limits";
import type { ExtractedDocument } from "./extract";
import type { ResumeReviewResponse, SopReviewResponse } from "./schemas";
import { readStorage, STORAGE_KEYS } from "./storage";
import { sanitizeShortText } from "./sanitize";
import type { WizardAnswers } from "@/types/wizard";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

function byokHeaders(): Record<string, string> {
  const key = readStorage(STORAGE_KEYS.geminiKey);
  return key ? { [AI_CONFIG.byokHeader]: key } : {};
}

async function send<T>(url: string, init: RequestInit): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 130_000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
    // Vercel's own body-size rejection is plain text, so map 413 explicitly.
    if (res.status === 413) return { ok: false, error: body?.error || FILE_TOO_LARGE_MESSAGE };
    if (!res.ok || !body) return { ok: false, error: body?.error || AI_BUSY_MESSAGE };
    return { ok: true, data: body };
  } catch {
    return {
      ok: false,
      error: controller.signal.aborted
        ? "The review took too long. " + AI_BUSY_MESSAGE
        : "We couldn't reach the server. Check your internet connection and try again.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export function requestResumeReview(answers: WizardAnswers, doc: ExtractedDocument) {
  const payload = {
    country: sanitizeShortText(answers.country, 60),
    university: sanitizeShortText(answers.university, 120),
    level: answers.level,
    levelOther: sanitizeShortText(answers.levelOther, 80),
    course: sanitizeShortText(answers.course, 100),
    funding: answers.funding,
    academics: {
      curriculum: sanitizeShortText(answers.academics.curriculum, 80),
      grade: sanitizeShortText(answers.academics.grade, 40),
      intake: sanitizeShortText(answers.academics.intake, 40),
      tests: Object.fromEntries(
        Object.entries(answers.academics.tests)
          .map(([k, v]) => [k, sanitizeShortText(v ?? "", 20)])
          .filter(([, v]) => v),
      ),
    },
    documentText: doc.text,
  };
  const form = new FormData();
  form.set("payload", JSON.stringify(payload));
  if (doc.pdfFile && doc.pdfFile.size <= MAX_PDF_UPLOAD_BYTES) form.set("pdf", doc.pdfFile);
  return send<ResumeReviewResponse>("/api/review", { method: "POST", body: form, headers: byokHeaders() });
}

export interface SopFormValues {
  docType: string;
  wordLimit: number | null;
  country: string;
  university: string;
  level: string;
  course: string;
  context: string;
  essayText: string;
  resumeText: string;
}

export function requestSopReview(values: SopFormValues) {
  return send<SopReviewResponse>("/api/sop", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...byokHeaders() },
    body: JSON.stringify(values),
  });
}
