"use client";

import type { ReactNode } from "react";
import { ScoreChart } from "@/components/results/ScoreChart";
import { Tabs } from "@/components/results/Tabs";
import type { SopReviewResponse } from "@/lib/schemas";
import { wordLimitStatus } from "@/lib/wordCount";
import { HighlightedEssay } from "./HighlightedEssay";

interface Props {
  result: SopReviewResponse;
  essay: string;
  target: { docType: string; country: string; university: string; level: string; course: string };
  hadResume: boolean;
  onEdit: () => void;
  onReReview: () => void;
}

function Card({ children }: { children: ReactNode }) {
  return <div className="print-break rounded-2xl border border-line bg-surface p-5 shadow-card">{children}</div>;
}

export function SopResults({ result, essay, target, hadResume, onEdit, onReReview }: Props) {
  const { review, wordCount, wordLimit } = result;
  const status = wordLimitStatus(wordCount, wordLimit);
  const s = review.scores;
  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const targetLine = [target.university, target.country, target.level, target.course].filter(Boolean).join(" · ");

  const tabs = [
    {
      id: "essay",
      label: "Highlighted essay",
      content: <HighlightedEssay text={essay} highlights={review.highlights} />,
    },
    {
      id: "scores",
      label: "Scores",
      content: (
        <ScoreChart
          title="Essay scores"
          rows={[
            { label: "Structure", ...s.structure },
            { label: "Clarity", ...s.clarity },
            { label: "Specificity", ...s.specificity },
            { label: "Originality", ...s.originality },
            { label: "Motivation & fit", ...s.motivationFit },
            { label: "Grammar & flow", ...s.grammarFlow },
          ]}
        />
      ),
    },
    {
      id: "show",
      label: "Show, don't tell",
      content:
        review.showDontTell.length === 0 ? (
          <p className="text-muted">Nice — no unsupported claims stood out.</p>
        ) : (
          <ul className="space-y-3">
            {review.showDontTell.map((c, i) => (
              <li key={i}>
                <Card>
                  <p className="font-semibold">Claim: “{c.claim}”</p>
                  <p className="mt-1 text-sm">
                    <strong>Evidence that would help:</strong> {c.evidenceNeeded}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        ),
    },
    {
      id: "consistency",
      label: "Consistency",
      content: !hadResume ? (
        <p className="text-muted">Add your resume on the form to check both documents tell the same story.</p>
      ) : review.consistencyCheck.length === 0 ? (
        <p className="text-muted">Your SOP and resume look consistent. 👍</p>
      ) : (
        <ul className="space-y-3">
          {review.consistencyCheck.map((c, i) => (
            <li key={i}>
              <Card>
                <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs font-semibold">Found in {c.foundIn}</span>
                <p className="mt-2 font-medium">{c.item}</p>
                <p className="mt-1 text-sm text-muted">{c.suggestion}</p>
              </Card>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "structure",
      label: "Structure",
      content: (
        <ol className="space-y-3">
          {review.structureFeedback.map((p, i) => (
            <li key={i}>
              <Card>
                <p className="text-sm font-semibold text-gold">Paragraph {p.paragraph}</p>
                <p className="mt-1">{p.note}</p>
              </Card>
            </li>
          ))}
        </ol>
      ),
    },
    {
      id: "officer",
      label: "Admissions view",
      content: (
        <Card>
          <h3 className="text-lg font-semibold">👩‍🏫 The admissions officer&apos;s view</h3>
          <p className="mt-2">{review.admissionsOfficerView}</p>
        </Card>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8" aria-live="polite">
      <div className="print-only mb-4 border-b border-line pb-3">
        <p className="font-serif text-2xl font-semibold">AdmitLens — Essay Review Report</p>
        <p className="text-sm">Generated on {today}</p>
      </div>
      <section className="print-break rounded-3xl border border-line bg-surface p-6 shadow-card">
        <h1 className="text-2xl font-semibold sm:text-3xl">{target.docType} review</h1>
        {targetLine && <p className="mt-1 wrap-break-word text-muted">{targetLine}</p>}
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span
            className="rounded-full px-3 py-1 font-semibold"
            style={
              status === "over"
                ? { color: "var(--band-high)", backgroundColor: "var(--band-high-bg)" }
                : status === "near"
                  ? { color: "var(--band-target)", backgroundColor: "var(--band-target-bg)" }
                  : { color: "var(--band-safety)", backgroundColor: "var(--band-safety-bg)" }
            }
          >
            📝 {wordCount.toLocaleString()} words
            {wordLimit ? ` / ${wordLimit.toLocaleString()} limit` : ""}
            {status === "over" ? ` — ${(wordCount - wordLimit!).toLocaleString()} over` : ""}
          </span>
          <span className="rounded-full bg-surface-2 px-3 py-1">{review.highlights.length} highlights</span>
        </div>
      </section>

      <div role="note" className="print-break mt-4 flex gap-3 rounded-2xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm">
        <span aria-hidden>🧭</span>
        <p>
          AdmitLens coaches — it never rewrites your essay. Example sentences are ideas only; write the final version in your
          own words. This is AI feedback, not an official assessment.
        </p>
      </div>

      <div className="no-print mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold">
          ✏️ Edit essay or details
        </button>
        <button type="button" onClick={onReReview} className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold">
          🔄 Re-review
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-indigo px-4 py-2.5 text-sm font-semibold text-on-indigo shadow-card"
        >
          📄 Download report
        </button>
      </div>

      <div className="mt-6">
        <Tabs tabs={tabs} label="Essay review sections" />
      </div>
      <p className="mt-8 text-xs text-muted">
        Reviewed by {result.provider === "mock" ? "mock AI (development mode)" : result.provider === "groq" ? "backup AI (Groq)" : "Gemini"} · {today}
      </p>
    </div>
  );
}
