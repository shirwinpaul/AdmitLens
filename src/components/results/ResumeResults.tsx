"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ResumeReview } from "@/lib/schemas";
import type { WizardAnswers } from "@/types/wizard";
import { BandBadge, Disclaimer } from "./BandBadge";
import { ScoreChart } from "./ScoreChart";
import { Tabs } from "./Tabs";

const VERIFY = "Typical — verify officially";

interface Props {
  review: ResumeReview;
  answers: WizardAnswers;
  provider: string;
  onChangeTarget: () => void;
  onCheckAnother: () => void;
  onReReview: () => void;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`print-break rounded-2xl border border-line bg-surface p-5 shadow-card ${className}`}>{children}</div>;
}

const IMPACT_STYLE: Record<string, string> = {
  High: "bg-indigo text-on-indigo",
  Medium: "bg-indigo-soft text-indigo",
  Low: "bg-surface-2 text-muted",
};

export function ResumeResults({ review, answers, provider, onChangeTarget, onCheckAnother, onReReview }: Props) {
  const level = answers.level === "Other" ? answers.levelOther : answers.level;
  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold">Why this band?</h3>
            <p className="mt-2">{review.bandExplanation}</p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold">How an admissions reader might summarise you</h3>
            <p className="mt-2 italic">“{review.profileSummary}”</p>
          </Card>
          <Card className="border-indigo/30">
            <h3 className="text-lg font-semibold">👩‍🏫 The admissions officer&apos;s view</h3>
            <p className="mt-2">{review.admissionsOfficerView}</p>
          </Card>
        </div>
      ),
    },
    {
      id: "strengths",
      label: "Strengths & Gaps",
      content: (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-xl font-semibold">💪 Strengths</h3>
            <ul className="space-y-3">
              {review.strengths.map((s, i) => (
                <li key={i}>
                  <Card>
                    <p className="font-semibold">{s.title}</p>
                    <p className="mt-1 text-sm text-muted">Evidence: {s.evidence}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-xl font-semibold">🧩 Gaps to work on</h3>
            <ul className="space-y-3">
              {review.gaps.map((g, i) => (
                <li key={i}>
                  <Card>
                    <p className="font-semibold">{g.title}</p>
                    <p className="mt-1 text-sm">
                      <strong>Why it matters:</strong> {g.whyItMatters}
                    </p>
                    <p className="mt-1 text-sm">
                      <strong>How to fix:</strong> {g.howToFix}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "lines",
      label: "Line Feedback",
      content:
        review.lineFeedback.length === 0 ? (
          <p className="text-muted">No line-by-line notes this time.</p>
        ) : (
          <ol className="space-y-3">
            {review.lineFeedback.map((l, i) => (
              <li key={i}>
                <Card>
                  <blockquote className="border-l-4 border-gold pl-3 font-mono text-sm">{l.quote}</blockquote>
                  <p className="mt-3 text-sm">
                    <strong>Issue:</strong> {l.issue}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>Suggestion:</strong> {l.suggestion}
                  </p>
                  <p className="mt-2 rounded-xl bg-indigo-soft px-3 py-2 text-sm">
                    <span className="font-semibold">Example (one sentence, make it your own):</span> {l.exampleRewrite}
                  </p>
                </Card>
              </li>
            ))}
          </ol>
        ),
    },
    {
      id: "scores",
      label: "Scores",
      content: (
        <ScoreChart
          title="Resume scores"
          rows={[
            { label: "Structure", ...review.scores.structure },
            { label: "Clarity", ...review.scores.clarity },
            { label: "Impact", ...review.scores.impact },
            { label: "Relevance", ...review.scores.relevanceToCourse },
            { label: "Formatting", ...review.scores.formatting },
          ]}
        />
      ),
    },
    {
      id: "funding",
      label: "Funding",
      content: (
        <Card>
          <h3 className="text-lg font-semibold">💰 Funding reality: {answers.funding}</h3>
          <p className="mt-2 whitespace-pre-line">{review.fundingReality.guidance}</p>
          <p className="mt-3 rounded-xl bg-gold-soft px-3 py-2 text-sm">
            🔎 {review.fundingReality.verifyNote} Always verify on official scholarship pages.
          </p>
        </Card>
      ),
    },
    {
      id: "requirements",
      label: "Requirements",
      content: (
        <div>
          <p className="mb-3 text-sm text-muted">
            Typical documents and tests for {level} applicants in {answers.country}. Requirements differ by program —
            check the official website.
          </p>
          <ul className="space-y-2">
            {review.requirementsChecklist.map((r, i) => (
              <li key={i} className="print-break flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                <span aria-hidden>☑️</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.item}</p>
                  {r.detail && <p className="text-sm text-muted">{r.detail}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-gold-soft px-2 py-0.5 text-xs font-medium">{VERIFY}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: "roadmap",
      label: "Roadmap",
      content: (
        <ol className="relative space-y-4 border-l-2 border-indigo/30 pl-6">
          {review.roadmap.map((r, i) => (
            <li key={i} className="print-break relative">
              <span className="absolute -left-8.25 grid h-6 w-6 place-items-center rounded-full bg-indigo text-xs font-bold text-on-indigo">
                {i + 1}
              </span>
              <Card>
                <p className="font-medium">{r.action}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${IMPACT_STYLE[r.impact]}`}>{r.impact} impact</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5">⏱ {r.timeframe}</span>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      ),
    },
    {
      id: "alternatives",
      label: "Alternatives",
      content: (
        <div>
          <p className="mb-4 rounded-xl bg-gold-soft px-3 py-2 text-sm font-medium">
            🤖 AI suggestions — research before applying.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {(
              [
                ["Similar level", review.alternativeUniversities.similarLevel],
                ["Safer options", review.alternativeUniversities.saferOptions],
              ] as const
            ).map(([title, list]) => (
              <div key={title}>
                <h3 className="mb-3 text-xl font-semibold">{title}</h3>
                <ul className="space-y-2">
                  {list.map((u, i) => (
                    <li key={i}>
                      <Card>
                        <p className="font-semibold">{u.name}</p>
                        <p className="text-sm text-muted">{u.reason}</p>
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8" aria-live="polite">
      <div className="print-only mb-4 border-b border-line pb-3">
        <p className="font-serif text-2xl font-semibold">AdmitLens — Resume Review Report</p>
        <p className="text-sm">Generated on {today}</p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="print-break rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8"
        aria-labelledby="result-title"
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <BandBadge band={review.band} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 id="result-title" className="wrap-break-word text-2xl font-semibold sm:text-3xl">
              {answers.university}
            </h1>
            <p className="mt-1 text-muted">
              {answers.country} · {level} · {answers.course}
            </p>
            <p className="mt-1 text-sm text-muted">Funding plan: {answers.funding}</p>
            <p className="mt-3 inline-block rounded-full bg-surface-2 px-3 py-1 text-sm">
              Confidence: <strong>{review.confidence}</strong>
            </p>
            <p className="mt-2 text-sm text-muted">{review.confidenceReason}</p>
          </div>
        </div>
      </motion.section>

      <div className="mt-4">
        <Disclaimer />
      </div>

      <div className="no-print mt-4 flex flex-wrap gap-2">
        <ActionButton onClick={onChangeTarget}>✏️ Change target</ActionButton>
        <ActionButton onClick={onCheckAnother}>🎯 Check another university</ActionButton>
        <ActionButton onClick={onReReview}>🔄 Re-review</ActionButton>
        <ActionButton onClick={() => window.print()} primary>
          📄 Download report
        </ActionButton>
        <Link href="/shortlist" className="rounded-xl px-4 py-2.5 text-sm font-medium text-indigo underline-offset-2 hover:underline">
          View shortlist →
        </Link>
      </div>

      <div className="mt-6">
        <Tabs tabs={tabs} label="Review sections" />
      </div>

      <p className="mt-8 text-xs text-muted">
        Reviewed by {provider === "mock" ? "mock AI (development mode)" : provider === "groq" ? "backup AI (Groq)" : "Gemini"} ·{" "}
        {today}
      </p>
    </div>
  );
}

function ActionButton({ children, onClick, primary }: { children: ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        primary ? "bg-indigo text-on-indigo shadow-card hover:opacity-90" : "border border-line bg-surface hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}
