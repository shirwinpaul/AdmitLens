"use client";

import { useEffect, useState } from "react";
import { DocumentInput, isDocumentReady } from "@/components/DocumentInput";
import { LoadingReview } from "@/components/results/LoadingReview";
import { requestSopReview } from "@/lib/client";
import type { ExtractedDocument } from "@/lib/extract";
import { SOP_DOC_TYPES, type SopReviewResponse } from "@/lib/schemas";
import { cleanTyping, sanitizeShortText } from "@/lib/sanitize";
import { readJSON, STORAGE_KEYS, writeJSON } from "@/lib/storage";
import { countWords, wordLimitStatus } from "@/lib/wordCount";
import type { WizardAnswers } from "@/types/wizard";
import { SopResults } from "./SopResults";

/** Saved between visits — never the essay or resume text. */
interface SopFormFields {
  docType: (typeof SOP_DOC_TYPES)[number];
  wordLimit: string;
  country: string;
  university: string;
  level: string;
  course: string;
  context: string;
}

function loadFields(): SopFormFields {
  const saved = readJSON<Partial<SopFormFields>>(STORAGE_KEYS.sopForm, {});
  // Pre-fill the target from the resume wizard if the student used it.
  const w = readJSON<Partial<WizardAnswers>>(STORAGE_KEYS.wizard, {});
  return {
    docType: saved.docType ?? "SOP",
    wordLimit: saved.wordLimit ?? "",
    country: saved.country || w.country || "",
    university: saved.university || w.university || "",
    level: saved.level || (w.level === "Other" ? w.levelOther : w.level) || "",
    course: saved.course || w.course || "",
    context: saved.context ?? "",
  };
}

const LOADING = [
  "Reading your essay…",
  "Looking for clichés and vague claims…",
  "Checking structure paragraph by paragraph…",
  "Comparing with your resume…",
  "Writing coaching notes…",
];

type View = { name: "form" } | { name: "loading" } | { name: "results"; result: SopReviewResponse; essay: string };

export function SopFlow() {
  const [fields, setFields] = useState(loadFields);
  const [essay, setEssay] = useState<ExtractedDocument | null>(null);
  const [resume, setResume] = useState<ExtractedDocument | null>(null);
  const [showResume, setShowResume] = useState(false);
  const [view, setView] = useState<View>({ name: "form" });
  const [error, setError] = useState("");

  useEffect(() => writeJSON(STORAGE_KEYS.sopForm, fields), [fields]);

  const set = (patch: Partial<SopFormFields>) => setFields((f) => ({ ...f, ...patch }));
  const limit = Number.parseInt(fields.wordLimit, 10);
  const wordLimit = Number.isFinite(limit) && limit >= 50 ? limit : null;
  const words = essay ? countWords(essay.text) : 0;
  const status = wordLimitStatus(words, wordLimit);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!essay || !isDocumentReady(essay, 100) || essay.isScanned) {
      setError(
        essay?.isScanned
          ? "We couldn't read text from this scanned PDF. Please upload a text PDF or Word file, or paste your essay."
          : "Please add your essay first (at least a few sentences).",
      );
      return;
    }
    setError("");
    setView({ name: "loading" });
    window.scrollTo({ top: 0 });
    const res = await requestSopReview({
      docType: fields.docType,
      wordLimit,
      country: sanitizeShortText(fields.country, 60),
      university: sanitizeShortText(fields.university, 120),
      level: sanitizeShortText(fields.level, 80),
      course: sanitizeShortText(fields.course, 100),
      context: sanitizeShortText(fields.context, 500),
      essayText: essay.text,
      resumeText: showResume && resume ? resume.text : "",
    });
    if (!res.ok) {
      setError(res.error);
      setView({ name: "form" });
      return;
    }
    setView({ name: "results", result: res.data, essay: essay.text });
  }

  if (view.name === "loading") return <LoadingReview messages={LOADING} />;
  if (view.name === "results") {
    return (
      <SopResults
        result={view.result}
        essay={view.essay}
        target={fields}
        hadResume={showResume && Boolean(resume)}
        onEdit={() => setView({ name: "form" })}
        onReReview={() => void submit()}
      />
    );
  }

  const input = "w-full rounded-xl border border-line bg-surface px-3 py-2.5";
  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-8 px-4 py-8" noValidate>
      <div>
        <h1 className="text-3xl font-semibold">SOP &amp; personal statement review</h1>
        <p className="mt-2 text-muted">
          Get coaching on your essay — clichés, vague claims, structure and fit. We never rewrite your essay for you.
        </p>
      </div>

      <section aria-labelledby="sop-essay" className="space-y-4">
        <h2 id="sop-essay" className="text-xl font-semibold">
          1. Your essay
        </h2>
        <DocumentInput noun="essay" value={essay} onChange={(d) => (setEssay(d), setError(""))} minChars={100} />
        {essay && (
          <p
            aria-live="polite"
            className={`text-sm font-medium ${
              status === "over" ? "text-(--band-high)" : status === "near" ? "text-(--band-target)" : "text-muted"
            }`}
          >
            {words.toLocaleString()} words{wordLimit ? ` / ${wordLimit.toLocaleString()} limit` : ""}
            {status === "over" && ` — ${(words - wordLimit!).toLocaleString()} over the limit`}
          </p>
        )}
      </section>

      <section aria-labelledby="sop-details" className="space-y-4">
        <h2 id="sop-details" className="text-xl font-semibold">
          2. Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="docType" className="mb-1.5 block text-sm font-medium">
              Document type
            </label>
            <select
              id="docType"
              value={fields.docType}
              onChange={(e) => set({ docType: e.target.value as SopFormFields["docType"] })}
              className={input}
            >
              {SOP_DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "Why this university essay" ? "“Why this university” essay" : t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="wordLimit" className="mb-1.5 block text-sm font-medium">
              Word limit (optional)
            </label>
            <input
              id="wordLimit"
              inputMode="numeric"
              value={fields.wordLimit}
              onChange={(e) => set({ wordLimit: e.target.value.replace(/\D/g, "").slice(0, 5) })}
              placeholder="e.g. 1000"
              className={input}
            />
          </div>
          {(
            [
              ["country", "Target country", 60, "e.g. Canada"],
              ["university", "University", 120, "e.g. Example University"],
              ["level", "Study level", 80, "e.g. Postgraduate (Master's)"],
              ["course", "Course", 100, "e.g. Data Science"],
            ] as const
          ).map(([key, label, max, ph]) => (
            <div key={key}>
              <label htmlFor={`sop-${key}`} className="mb-1.5 block text-sm font-medium">
                {label} <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id={`sop-${key}`}
                value={fields[key]}
                maxLength={max}
                placeholder={ph}
                onChange={(e) => set({ [key]: cleanTyping(e.target.value, max) })}
                className={input}
              />
            </div>
          ))}
        </div>
        <div>
          <label htmlFor="sop-context" className="mb-1.5 block text-sm font-medium">
            Anything the reviewer should know? <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="sop-context"
            rows={2}
            maxLength={500}
            value={fields.context}
            onChange={(e) => set({ context: cleanTyping(e.target.value.replace(/\n/g, " "), 500) })}
            placeholder="e.g. The prompt asks about a challenge I overcame."
            className={input}
          />
        </div>
      </section>

      <section aria-labelledby="sop-resume" className="space-y-4">
        <h2 id="sop-resume" className="text-xl font-semibold">
          3. Consistency check <span className="text-base font-normal text-muted">(optional)</span>
        </h2>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={showResume}
            onChange={(e) => setShowResume(e.target.checked)}
            className="mt-1 h-5 w-5 accent-(--indigo)"
          />
          <span>Also add my resume, to find achievements mentioned in one document but missing from the other.</span>
        </label>
        {showResume && <DocumentInput noun="resume" value={resume} onChange={setResume} />}
      </section>

      <div aria-live="assertive">
        {error && (
          <p role="alert" className="rounded-xl bg-(--band-high-bg) px-4 py-3 text-sm font-medium text-(--band-high)">
            {error}
          </p>
        )}
      </div>
      <button type="submit" className="w-full rounded-xl bg-indigo px-6 py-3.5 font-semibold text-on-indigo shadow-card sm:w-auto">
        🔍 Review my essay
      </button>
    </form>
  );
}
