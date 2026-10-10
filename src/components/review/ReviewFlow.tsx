"use client";

import { useState } from "react";
import { LoadingReview } from "@/components/results/LoadingReview";
import { ResumeResults } from "@/components/results/ResumeResults";
import { ResumeWizard } from "@/components/wizard/ResumeWizard";
import { requestResumeReview } from "@/lib/client";
import type { ExtractedDocument } from "@/lib/extract";
import type { ResumeReviewResponse } from "@/lib/schemas";
import { upsertShortlist } from "@/lib/shortlist";
import { readJSON, STORAGE_KEYS } from "@/lib/storage";
import { EMPTY_ANSWERS, type WizardAnswers } from "@/types/wizard";

const LOADING_MESSAGES = [
  "Reading your resume…",
  "Understanding your target program…",
  "Comparing with typical admits…",
  "Checking funding realities…",
  "Writing honest, practical feedback…",
];

function loadAnswers(): WizardAnswers {
  const saved = readJSON<Partial<WizardAnswers>>(STORAGE_KEYS.wizard, {});
  return {
    ...EMPTY_ANSWERS,
    ...saved,
    academics: { ...EMPTY_ANSWERS.academics, ...saved.academics, tests: { ...saved.academics?.tests } },
  };
}

type View =
  | { name: "wizard"; step: number }
  | { name: "loading" }
  | { name: "error"; message: string }
  | { name: "results"; result: ResumeReviewResponse };

/** Resume review flow: wizard → AI review → results. The document stays in memory only. */
export function ReviewFlow() {
  const [answers, setAnswers] = useState(loadAnswers);
  const [doc, setDoc] = useState<ExtractedDocument | null>(null);
  const [view, setView] = useState<View>({ name: "wizard", step: 0 });
  // Bumped to remount the wizard with fresh initial state when re-entering it.
  const [wizardKey, setWizardKey] = useState(0);

  async function submit(a: WizardAnswers, d: ExtractedDocument) {
    setAnswers(a);
    setDoc(d);
    setView({ name: "loading" });
    window.scrollTo({ top: 0 });
    const res = await requestResumeReview(a, d);
    if (!res.ok) {
      setView({ name: "error", message: res.error });
      return;
    }
    const { review } = res.data;
    upsertShortlist({
      checkedAt: new Date().toISOString(),
      university: a.university,
      country: a.country,
      level: a.level === "Other" ? a.levelOther : a.level,
      course: a.course,
      funding: a.funding,
      band: review.band,
      confidence: review.confidence,
      topGap: review.gaps[0]?.title ?? "—",
    });
    setView({ name: "results", result: res.data });
  }

  function openWizard(step: number) {
    setWizardKey((k) => k + 1);
    setView({ name: "wizard", step });
    window.scrollTo({ top: 0 });
  }

  switch (view.name) {
    case "loading":
      return <LoadingReview messages={LOADING_MESSAGES} />;
    case "error":
      return (
        <div className="mx-auto max-w-xl px-4 py-20 text-center" role="alert">
          <p className="text-4xl" aria-hidden>
            😕
          </p>
          <h1 className="mt-4 text-2xl font-semibold">We couldn&apos;t finish your review</h1>
          <p className="mt-3 text-muted">{view.message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {doc && (
              <button
                type="button"
                onClick={() => void submit(answers, doc)}
                className="rounded-xl bg-indigo px-5 py-2.5 font-semibold text-on-indigo"
              >
                Try again
              </button>
            )}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("admitlens:open-settings"))}
              className="rounded-xl border border-line bg-surface px-5 py-2.5 font-semibold"
            >
              ⚙️ Add my own key
            </button>
            <button type="button" onClick={() => openWizard(7)} className="rounded-xl px-5 py-2.5 font-medium text-indigo">
              ← Back to my answers
            </button>
          </div>
        </div>
      );
    case "results":
      return (
        <ResumeResults
          review={view.result.review}
          provider={view.result.provider}
          answers={answers}
          onChangeTarget={() => openWizard(1)}
          onCheckAnother={() => {
            setAnswers((a) => ({ ...a, university: "", universityIsCustom: false }));
            openWizard(2);
          }}
          onReReview={() => doc && void submit(answers, doc)}
        />
      );
    default:
      return (
        <ResumeWizard
          key={wizardKey}
          initialAnswers={answers}
          initialDoc={doc}
          initialStep={view.step}
          onSubmit={(a, d) => void submit(a, d)}
        />
      );
  }
}
