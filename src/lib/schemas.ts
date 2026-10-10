/**
 * Zod schemas for every API input and every AI output.
 * Honesty rule: there is deliberately NO probability / percentage field anywhere, and
 * output text that states a percentage chance is rejected (which triggers a retry).
 */
import { z } from "zod";
import { BANDS } from "@/config/bands";

// ---------- Shared enums ----------
export const STUDY_LEVELS = [
  "Undergraduate (Bachelor's)",
  "Postgraduate (Master's)",
  "PhD / Doctorate",
  "Diploma / Foundation",
  "Exchange / Study Abroad Semester",
  "Other",
] as const;

export const FUNDING_PLANS = [
  "I can pay full fees",
  "I need a partial scholarship",
  "I need a fully funded scholarship",
] as const;

export const TEST_NAMES = ["SAT", "ACT", "IELTS", "TOEFL", "Duolingo", "GRE", "GMAT"] as const;

export const SOP_DOC_TYPES = [
  "SOP",
  "Personal Statement",
  "Common App essay",
  "Why this university essay",
  "Other",
] as const;

const shortText = (max: number) => z.string().trim().max(max);

// ---------- API inputs ----------
export const targetSchema = z.object({
  country: shortText(60).min(1, "Choose a country"),
  university: shortText(120).min(1, "Choose a university"),
  level: z.enum(STUDY_LEVELS),
  levelOther: shortText(80).default(""),
  course: shortText(100).min(1, "Enter a course"),
});

export const academicsSchema = z.object({
  curriculum: shortText(80).default(""),
  grade: shortText(40).default(""),
  tests: z.partialRecord(z.enum(TEST_NAMES), shortText(20)).default({}),
  intake: shortText(40).default(""),
});

export const resumeRequestSchema = targetSchema.extend({
  funding: z.enum(FUNDING_PLANS),
  academics: academicsSchema.default({ curriculum: "", grade: "", tests: {}, intake: "" }),
  documentText: z.string().max(60_000).default(""),
});
export type ResumeRequest = z.infer<typeof resumeRequestSchema>;

export const sopRequestSchema = z.object({
  docType: z.enum(SOP_DOC_TYPES),
  wordLimit: z.number().int().min(50).max(10_000).nullable().default(null),
  country: shortText(60).default(""),
  university: shortText(120).default(""),
  level: shortText(80).default(""),
  course: shortText(100).default(""),
  context: shortText(500).default(""),
  essayText: z.string().trim().min(100, "Your essay looks too short to review.").max(40_000),
  resumeText: z.string().max(60_000).default(""),
});
export type SopRequest = z.infer<typeof sopRequestSchema>;

// ---------- AI outputs ----------
/** Catches "75% chance", "probability of 0.6", "80 percent likely" etc. */
const PERCENT_CHANCE =
  /(\d{1,3}(\.\d+)?\s*(%|percent)\s*(chance|probability|likelihood|likely|odds))|((chance|probability|likelihood|odds)\s*(of|is|:)?\s*(about|around|roughly)?\s*\d{1,3}(\.\d+)?\s*(%|percent))/i;

export function containsPercentChance(value: unknown): boolean {
  if (typeof value === "string") return PERCENT_CHANCE.test(value);
  if (Array.isArray(value)) return value.some(containsPercentChance);
  if (value && typeof value === "object") return Object.values(value).some(containsPercentChance);
  return false;
}

const scoreItem = z.object({
  score: z.number().min(0).max(10),
  reason: z.string().min(1).max(300),
});

/** One sentence max: short, and not more than one sentence-ending mark mid-text. */
const oneSentence = z
  .string()
  .max(300)
  .refine((s) => (s.trim().match(/[.!?](\s|$)/g) ?? []).length <= 1, "exampleRewrite must be one sentence");

export const resumeReviewSchema = z
  .object({
    band: z.enum(BANDS),
    confidence: z.enum(["Low", "Medium", "High"]),
    confidenceReason: z.string().min(1).max(500),
    bandExplanation: z.string().min(1).max(1200),
    profileSummary: z.string().min(1).max(500),
    strengths: z.array(z.object({ title: z.string().min(1).max(150), evidence: z.string().min(1).max(500) })).min(1).max(8),
    gaps: z
      .array(
        z.object({
          title: z.string().min(1).max(150),
          whyItMatters: z.string().min(1).max(500),
          howToFix: z.string().min(1).max(600),
        }),
      )
      .min(1)
      .max(8),
    scores: z.object({
      structure: scoreItem,
      clarity: scoreItem,
      impact: scoreItem,
      relevanceToCourse: scoreItem,
      formatting: scoreItem,
    }),
    lineFeedback: z
      .array(
        z.object({
          quote: z.string().min(1).max(300),
          issue: z.string().min(1).max(400),
          suggestion: z.string().min(1).max(500),
          exampleRewrite: oneSentence,
        }),
      )
      .max(10),
    fundingReality: z.object({
      guidance: z.string().min(1).max(1500),
      verifyNote: z.string().min(1).max(300),
    }),
    requirementsChecklist: z
      .array(z.object({ item: z.string().min(1).max(200), detail: z.string().max(400) }))
      .min(1)
      .max(15),
    roadmap: z
      .array(
        z.object({
          action: z.string().min(1).max(400),
          impact: z.enum(["High", "Medium", "Low"]),
          timeframe: z.string().min(1).max(80),
        }),
      )
      .min(3)
      .max(6),
    alternativeUniversities: z.object({
      similarLevel: z.array(z.object({ name: z.string().min(1).max(150), reason: z.string().min(1).max(300) })).min(1).max(3),
      saferOptions: z.array(z.object({ name: z.string().min(1).max(150), reason: z.string().min(1).max(300) })).min(1).max(3),
    }),
    admissionsOfficerView: z.string().min(1).max(1500),
  })
  .refine((v) => !containsPercentChance(v), {
    message: "Do not state any percentage chance or probability of admission. Use the band only.",
  });
export type ResumeReview = z.infer<typeof resumeReviewSchema>;

export const HIGHLIGHT_TYPES = [
  "cliché",
  "vague claim",
  "tell-don't-show",
  "repetition",
  "passive voice",
  "grammar",
  "strong line",
] as const;
export type HighlightType = (typeof HIGHLIGHT_TYPES)[number];

export const sopReviewSchema = z
  .object({
    scores: z.object({
      structure: scoreItem,
      clarity: scoreItem,
      specificity: scoreItem,
      originality: scoreItem,
      motivationFit: scoreItem,
      grammarFlow: scoreItem,
    }),
    highlights: z
      .array(
        z.object({
          quote: z.string().min(1).max(400),
          type: z.enum(HIGHLIGHT_TYPES),
          comment: z.string().min(1).max(500),
          exampleRewrite: oneSentence.nullable(),
        }),
      )
      .max(20),
    showDontTell: z
      .array(z.object({ claim: z.string().min(1).max(300), evidenceNeeded: z.string().min(1).max(500) }))
      .max(10),
    consistencyCheck: z
      .array(
        z.object({
          item: z.string().min(1).max(300),
          foundIn: z.enum(["resume only", "SOP only"]),
          suggestion: z.string().min(1).max(500),
        }),
      )
      .max(10),
    structureFeedback: z
      .array(z.object({ paragraph: z.number().int().min(1).max(50), note: z.string().min(1).max(600) }))
      .max(20),
    admissionsOfficerView: z.string().min(1).max(1500),
  })
  .refine((v) => !containsPercentChance(v), {
    message: "Do not state any percentage chance or probability of admission.",
  });
export type SopReview = z.infer<typeof sopReviewSchema>;

/** What the SOP API returns: the AI review plus numbers computed in code. */
export interface SopReviewResponse {
  review: SopReview;
  wordCount: number;
  wordLimit: number | null;
  provider: string;
}

export interface ResumeReviewResponse {
  review: ResumeReview;
  provider: string;
}
