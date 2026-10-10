import type { FUNDING_PLANS, STUDY_LEVELS, TEST_NAMES } from "@/lib/schemas";

export type StudyLevel = (typeof STUDY_LEVELS)[number];
export type FundingPlan = (typeof FUNDING_PLANS)[number];
export type TestName = (typeof TEST_NAMES)[number];

/** Wizard answers. Saved in localStorage — the document itself never is. */
export interface WizardAnswers {
  country: string;
  university: string;
  universityIsCustom: boolean;
  level: StudyLevel | "";
  levelOther: string;
  funding: FundingPlan | "";
  course: string;
  academics: {
    curriculum: string;
    grade: string;
    tests: Partial<Record<TestName, string>>;
    intake: string;
  };
}

export const EMPTY_ANSWERS: WizardAnswers = {
  country: "",
  university: "",
  universityIsCustom: false,
  level: "",
  levelOther: "",
  funding: "",
  course: "",
  academics: { curriculum: "", grade: "", tests: {}, intake: "" },
};
