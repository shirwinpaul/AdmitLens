/**
 * MOCK_AI=true (development only): realistic fake reviews without using any AI quota.
 * Quotes are taken from the real document so highlights and line feedback can be tested.
 */
import type { HighlightType, ResumeRequest, ResumeReview, SopRequest, SopReview } from "@/lib/schemas";

const VERY_SELECTIVE = /harvard|stanford|massachusetts institute of technology|\bmit\b|princeton|yale|oxford|cambridge|caltech|california institute of technology/i;

function candidateLines(text: string, max: number): string[] {
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 25 && l.length <= 200)
    .slice(0, max);
}

function sentences(text: string): string[] {
  return (text.match(/[^.!?\n]+[.!?]/g) ?? []).map((s) => s.trim()).filter((s) => s.length >= 20 && s.length <= 300);
}

export function mockResumeReview(req: ResumeRequest): ResumeReview {
  const lines = candidateLines(req.documentText, 4);
  const hasAcademics = Boolean(req.academics.grade || Object.values(req.academics.tests).some((v) => v?.trim()));
  const selective = VERY_SELECTIVE.test(req.university);
  const band = selective ? "High Reach" : hasAcademics ? "Target" : "Reach";
  const fully = req.funding === "I need a fully funded scholarship";

  return {
    band,
    confidence: hasAcademics ? "Medium" : "Low",
    confidenceReason: hasAcademics
      ? "You shared grades/test scores, but this is a general estimate without full program data."
      : "No grades or test scores were provided, so this estimate is uncertain.",
    bandExplanation: `[MOCK] Based on your resume, your profile for ${req.course} at ${req.university} looks ${band === "Target" ? "in line with" : "below"} typical admits in some areas. ${selective ? "This university is extremely selective — even outstanding applicants are often rejected." : "Stronger quantified impact would help."}`,
    profileSummary: `[MOCK] A motivated applicant interested in ${req.course}, with some relevant projects. Needs clearer evidence of impact and fit.`,
    strengths: [
      { title: "Relevant projects", evidence: lines[0] ?? "Projects section of the resume" },
      { title: "Clear interest in the field", evidence: lines[1] ?? "Stated interests" },
    ],
    gaps: [
      {
        title: "Few quantified achievements",
        whyItMatters: "Admissions readers look for measurable impact, not just responsibilities.",
        howToFix: "Add numbers: users, accuracy, time saved, rank, team size.",
      },
      {
        title: hasAcademics ? "Limited research or competition exposure" : "Missing academic details",
        whyItMatters: "Grades and tests are core evidence for most programs.",
        howToFix: hasAcademics ? "Join a research project or a recognised competition." : "Add your GPA/percentage and test scores.",
      },
    ],
    scores: {
      structure: { score: 7, reason: "Logical sections, easy to scan." },
      clarity: { score: 6, reason: "Some bullets are vague." },
      impact: { score: 5, reason: "Few numbers showing results." },
      relevanceToCourse: { score: 7, reason: `Good links to ${req.course}.` },
      formatting: { score: 8, reason: "Consistent layout." },
    },
    lineFeedback: lines.slice(0, 3).map((quote) => ({
      quote,
      issue: "Describes a task but not the result.",
      suggestion: "Lead with a strong verb and add a measurable outcome.",
      exampleRewrite: "Built a tool that cut weekly report time from 3 hours to 1 hour for 200 users.",
    })),
    fundingReality: {
      guidance: fully
        ? `Fully funded awards for international students at the ${req.level} level are rare and highly competitive in many countries. Apply widely and look for university and government scholarships.`
        : "Partial scholarships and merit awards are more common than full funding; costs vary a lot between countries and universities.",
      verifyNote: "Verify all amounts and deadlines on the official scholarship pages.",
    },
    requirementsChecklist: [
      { item: "Academic transcripts", detail: "Official copies, often with translations." },
      { item: "English test (IELTS/TOEFL/Duolingo)", detail: "Minimum scores vary by program." },
      { item: "Statement of purpose / personal statement", detail: "Program-specific." },
      { item: "Letters of recommendation", detail: "Usually 2–3." },
    ],
    roadmap: [
      { action: "Add numbers to your top 5 resume bullets", impact: "High", timeframe: "This week" },
      { action: "Complete one project directly related to your course", impact: "High", timeframe: "1–3 months" },
      { action: "Prepare for your English test", impact: "Medium", timeframe: "1–2 months" },
    ],
    alternativeUniversities: {
      similarLevel: [
        { name: "Example University A", reason: "[MOCK] Similar selectivity." },
        { name: "Example University B", reason: "[MOCK] Strong program in your field." },
        { name: "Example University C", reason: "[MOCK] Comparable profile of admits." },
      ],
      saferOptions: [
        { name: "Example College D", reason: "[MOCK] Less competitive admissions." },
        { name: "Example College E", reason: "[MOCK] Good scholarships for internationals." },
        { name: "Example College F", reason: "[MOCK] Flexible entry requirements." },
      ],
    },
    admissionsOfficerView:
      "[MOCK] I can see genuine interest and effort here. To stand out, show me the results of your work and why this program is the right next step.",
  };
}

const CLICHE = /since (my )?childhood|always been (passionate|fascinated)|passion for|dream (of|to)|ever since i was|make a difference/i;

export function mockSopReview(req: SopRequest): SopReview {
  const sents = sentences(req.essayText);
  const weakTypes: HighlightType[] = ["vague claim", "tell-don't-show", "passive voice", "repetition", "grammar"];
  const highlights = sents.slice(0, 6).map((quote, i) => {
    const type: HighlightType = CLICHE.test(quote) ? "cliché" : i === 1 ? "strong line" : weakTypes[i % weakTypes.length]!;
    return {
      quote,
      type,
      comment: type === "strong line" ? "[MOCK] Specific and personal — keep this." : `[MOCK] This reads as a ${type}. Make it concrete.`,
      exampleRewrite: type === "strong line" ? null : "In my final-year project, I halved model error on real hospital data.",
    };
  });
  const paragraphs = req.essayText.split(/\n\s*\n/).filter((p) => p.trim());
  const resumeLines = candidateLines(req.resumeText, 10).filter((l) => !req.essayText.includes(l.slice(0, 20)));

  return {
    scores: {
      structure: { score: 7, reason: "Clear beginning, middle and end." },
      clarity: { score: 6, reason: "A few long sentences." },
      specificity: { score: 5, reason: "Several general claims." },
      originality: { score: 5, reason: "Opening uses a common theme." },
      motivationFit: { score: 6, reason: `Fit with ${req.university || "the program"} could be clearer.` },
      grammarFlow: { score: 8, reason: "Mostly correct and smooth." },
    },
    highlights,
    showDontTell: [
      { claim: "Says they are hard-working", evidenceNeeded: "Describe one moment that shows it, with a result." },
    ],
    consistencyCheck: req.resumeText.trim()
      ? resumeLines.slice(0, 2).map((item) => ({
          item,
          foundIn: "resume only" as const,
          suggestion: "[MOCK] Consider mentioning this in your SOP if it supports your story.",
        }))
      : [],
    structureFeedback: paragraphs.slice(0, 6).map((_, i) => ({
      paragraph: i + 1,
      note: i === 0 ? "[MOCK] Hook could be more specific." : "[MOCK] Link this paragraph back to your goals.",
    })),
    admissionsOfficerView:
      "[MOCK] Sincere and readable. Replace general statements with specific moments, and say exactly why this program fits your next step.",
  };
}
