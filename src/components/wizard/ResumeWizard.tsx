"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ChoiceCards } from "@/components/ChoiceCards";
import { CountrySelect } from "@/components/CountrySelect";
import { DocumentInput, isDocumentReady } from "@/components/DocumentInput";
import { UniversitySelect } from "@/components/UniversitySelect";
import type { ExtractedDocument } from "@/lib/extract";
import { FUNDING_PLANS, STUDY_LEVELS, TEST_NAMES } from "@/lib/schemas";
import { cleanTyping } from "@/lib/sanitize";
import { STORAGE_KEYS, writeJSON } from "@/lib/storage";
import type { FundingPlan, StudyLevel, WizardAnswers } from "@/types/wizard";

export const COURSE_SUGGESTIONS = [
  "Computer Science",
  "Data Science",
  "Artificial Intelligence",
  "Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Business",
  "Management",
  "Economics",
  "Finance",
  "Medicine",
  "Law",
  "Psychology",
  "Design",
  "Architecture",
  "Biotechnology",
  "Public Health",
  "Media & Communication",
];

const LEVEL_ICONS: Record<StudyLevel, string> = {
  "Undergraduate (Bachelor's)": "🎒",
  "Postgraduate (Master's)": "🎓",
  "PhD / Doctorate": "🔬",
  "Diploma / Foundation": "📘",
  "Exchange / Study Abroad Semester": "✈️",
  Other: "✏️",
};

const FUNDING_INFO: Record<FundingPlan, { icon: string; hint: string }> = {
  "I can pay full fees": { icon: "💳", hint: "You or your family can cover tuition and living costs." },
  "I need a partial scholarship": { icon: "🤝", hint: "You need help with part of the cost." },
  "I need a fully funded scholarship": { icon: "🏅", hint: "You need tuition and living costs covered." },
};

const TEST_PLACEHOLDERS: Record<string, string> = {
  SAT: "e.g. 1450",
  ACT: "e.g. 32",
  IELTS: "e.g. 7.5",
  TOEFL: "e.g. 105",
  Duolingo: "e.g. 125",
  GRE: "e.g. 320",
  GMAT: "e.g. 680",
};

export const STEP_TITLES = [
  "Upload your resume",
  "Target country",
  "University",
  "Study level",
  "Funding plan",
  "Course or field",
  "Academic details",
  "Review your answers",
] as const;

interface Props {
  initialAnswers: WizardAnswers;
  initialDoc: ExtractedDocument | null;
  /** 0-based step to open on (e.g. 1 = "Target country" when changing target). */
  initialStep?: number;
  onSubmit: (answers: WizardAnswers, doc: ExtractedDocument) => void;
}

export function ResumeWizard({ initialAnswers, initialDoc, initialStep = 0, onSubmit }: Props) {
  const [step, setStep] = useState(initialStep);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<WizardAnswers>(initialAnswers);
  const [doc, setDoc] = useState<ExtractedDocument | null>(initialDoc);
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Remember answers (never the document).
  useEffect(() => writeJSON(STORAGE_KEYS.wizard, answers), [answers]);

  // On step change, move focus to the heading (unless the step auto-focuses a field)
  // so screen-reader and keyboard users land at the top of the new step.
  // Compares with the previous step so React StrictMode's double effects don't trigger it.
  const prevStep = useRef(step);
  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;
    if (![1, 2, 5].includes(step)) headingRef.current?.focus();
  }, [step]);

  // Enter = Next even when focus is on the heading or page (inputs submit the form natively).
  const nextRef = useRef<() => void>(() => {});
  useEffect(() => {
    nextRef.current = next;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.defaultPrevented || e.isComposing) return;
      const el = document.activeElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A" || tag === "SELECT") return;
      if (el?.closest("dialog")) return;
      e.preventDefault();
      nextRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const update = (patch: Partial<WizardAnswers>) => {
    setError("");
    setAnswers((a) => ({ ...a, ...patch }));
  };
  const updateAcademics = (patch: Partial<WizardAnswers["academics"]>) =>
    setAnswers((a) => ({ ...a, academics: { ...a.academics, ...patch } }));

  function validate(i: number): string {
    switch (i) {
      case 0:
        return isDocumentReady(doc) ? "" : "Please upload your resume or paste at least a few lines of it.";
      case 1:
        return answers.country.trim() ? "" : "Please choose your target country.";
      case 2:
        return answers.university.trim() ? "" : "Please choose or type a university.";
      case 3:
        if (!answers.level) return "Please choose a study level.";
        return answers.level === "Other" && !answers.levelOther.trim() ? "Please type your study level." : "";
      case 4:
        return answers.funding ? "" : "Please choose a funding plan.";
      case 5:
        return answers.course.trim() ? "" : "Please enter the course or field you want to study.";
      default:
        return "";
    }
  }

  function go(to: number) {
    setDirection(to > step ? 1 : -1);
    setError("");
    setStep(to);
  }

  function next() {
    const msg = validate(step);
    if (msg) {
      setError(msg);
      return;
    }
    if (step === STEP_TITLES.length - 1) {
      // Every earlier step must be valid before submitting.
      const firstInvalid = STEP_TITLES.findIndex((_, i) => validate(i));
      if (firstInvalid >= 0) {
        go(firstInvalid);
        setError(validate(firstInvalid));
        return;
      }
      onSubmit(answers, doc!);
      return;
    }
    go(step + 1);
  }

  const progress = ((step + 1) / STEP_TITLES.length) * 100;
  const isLast = step === STEP_TITLES.length - 1;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
      className="mx-auto max-w-2xl px-4 py-8"
      noValidate
    >
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm text-muted">
          <span>
            Step {step + 1} of {STEP_TITLES.length}
          </span>
          {step === 6 && <span className="font-medium text-gold">Optional</span>}
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEP_TITLES.length}
          aria-valuenow={step + 1}
          aria-label="Wizard progress"
        >
          <motion.div className="h-full rounded-full bg-indigo" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <h1 ref={headingRef} tabIndex={-1} className="mb-2 text-3xl font-semibold outline-none">
            {STEP_TITLES[step]}
          </h1>
          <div className="mt-6">{renderStep()}</div>
        </motion.div>
      </AnimatePresence>

      <div aria-live="assertive" className="mt-4 min-h-6">
        {error && (
          <p role="alert" className="text-sm font-medium text-(--band-high)">
            {error}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go(step - 1)}
          disabled={step === 0}
          className="rounded-xl border border-line bg-surface px-5 py-3 font-medium disabled:invisible"
        >
          ← Back
        </button>
        <button type="submit" className="rounded-xl bg-indigo px-6 py-3 font-semibold text-on-indigo shadow-card">
          {isLast ? "🔍 Review my profile" : "Next →"}
        </button>
      </div>
      {!isLast && <p className="mt-3 text-center text-xs text-muted">Tip: press Enter to continue</p>}
    </form>
  );

  function renderStep() {
    switch (step) {
      case 0:
        return <DocumentInput noun="resume" value={doc} onChange={(d) => (setDoc(d), setError(""))} />;
      case 1:
        return (
          <CountrySelect
            value={answers.country}
            autoFocus
            onChange={(country) =>
              update(
                country === answers.country
                  ? { country }
                  : { country, university: "", universityIsCustom: false },
              )
            }
          />
        );
      case 2:
        return (
          <UniversitySelect
            key={answers.country}
            country={answers.country}
            value={answers.university}
            isCustom={answers.universityIsCustom}
            onChange={(university, universityIsCustom) => update({ university, universityIsCustom })}
          />
        );
      case 3:
        return (
          <div className="space-y-4">
            <ChoiceCards
              legend="Study level"
              value={answers.level}
              onChange={(level) => update({ level })}
              choices={STUDY_LEVELS.map((l) => ({ value: l, label: l === "Other" ? "Other (type)" : l, icon: LEVEL_ICONS[l] }))}
            />
            {answers.level === "Other" && (
              <TextField
                id="level-other"
                label="Type your study level"
                value={answers.levelOther}
                maxLength={80}
                onChange={(levelOther) => update({ levelOther })}
              />
            )}
          </div>
        );
      case 4:
        return (
          <ChoiceCards
            legend="Funding plan"
            value={answers.funding}
            onChange={(funding) => update({ funding })}
            choices={FUNDING_PLANS.map((f) => ({ value: f, label: f, ...FUNDING_INFO[f] }))}
          />
        );
      case 5:
        return (
          <div className="space-y-4">
            <TextField
              id="course"
              label="What do you want to study?"
              value={answers.course}
              maxLength={100}
              placeholder="e.g. Data Science"
              autoFocus
              onChange={(course) => update({ course })}
            />
            <div>
              <p className="mb-2 text-sm text-muted">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {COURSE_SUGGESTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update({ course: c })}
                    aria-pressed={answers.course === c}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      answers.course === c ? "border-indigo bg-indigo-soft font-medium" : "border-line bg-surface hover:bg-surface-2"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-5">
            <p className="rounded-xl bg-indigo-soft px-4 py-3 text-sm">
              ✨ All optional — but grades and test scores make your review much more accurate (and raise its
              confidence level). Leave anything blank you don&apos;t have yet.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="curriculum"
                label="Curriculum / board"
                placeholder="e.g. CBSE, IB, A-Levels"
                value={answers.academics.curriculum}
                maxLength={80}
                onChange={(curriculum) => updateAcademics({ curriculum })}
              />
              <TextField
                id="grade"
                label="Current or final percentage / GPA"
                placeholder="e.g. 88% or 3.6/4.0"
                value={answers.academics.grade}
                maxLength={40}
                onChange={(grade) => updateAcademics({ grade })}
              />
              <TextField
                id="intake"
                label="Application year / intake"
                placeholder="e.g. Fall 2027"
                value={answers.academics.intake}
                maxLength={40}
                onChange={(intake) => updateAcademics({ intake })}
              />
            </div>
            <fieldset>
              <legend className="mb-2 font-medium">Standardised tests (only the ones you took)</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TEST_NAMES.map((t) => (
                  <TextField
                    key={t}
                    id={`test-${t}`}
                    label={t}
                    placeholder={TEST_PLACEHOLDERS[t]}
                    value={answers.academics.tests[t] ?? ""}
                    maxLength={20}
                    onChange={(v) => updateAcademics({ tests: { ...answers.academics.tests, [t]: v } })}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        );
      default:
        return <Summary answers={answers} doc={doc} onEdit={go} />;
    }
  }
}

function TextField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1.5 block text-sm font-medium">
        {props.label}
      </label>
      <input
        id={props.id}
        value={props.value}
        maxLength={props.maxLength}
        placeholder={props.placeholder}
        autoFocus={props.autoFocus}
        onChange={(e) => props.onChange(cleanTyping(e.target.value, props.maxLength))}
        className="w-full rounded-xl border border-line bg-surface px-3 py-2.5"
      />
    </div>
  );
}

function Summary({
  answers,
  doc,
  onEdit,
}: {
  answers: WizardAnswers;
  doc: ExtractedDocument | null;
  onEdit: (step: number) => void;
}) {
  const tests = Object.entries(answers.academics.tests)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${k} ${v}`)
    .join(", ");
  const rows: [string, string, number][] = [
    ["Resume", doc ? doc.fileName : "—", 0],
    ["Country", answers.country, 1],
    ["University", answers.university, 2],
    ["Study level", answers.level === "Other" ? answers.levelOther : answers.level, 3],
    ["Funding plan", answers.funding, 4],
    ["Course", answers.course, 5],
    [
      "Academic details",
      [answers.academics.curriculum, answers.academics.grade, tests, answers.academics.intake].filter(Boolean).join(" · ") ||
        "Not provided (review confidence will be lower)",
      6,
    ],
  ];
  return (
    <dl className="divide-y divide-line rounded-2xl border border-line bg-surface shadow-card">
      {rows.map(([label, value, stepIndex]) => (
        <div key={label} className="flex items-start justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="wrap-break-word font-medium">{value || "—"}</dd>
          </div>
          <button
            type="button"
            onClick={() => onEdit(stepIndex)}
            className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-indigo underline-offset-2 hover:underline"
            aria-label={`Edit ${label}`}
          >
            Edit
          </button>
        </div>
      ))}
    </dl>
  );
}
