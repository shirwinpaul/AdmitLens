import { describe, expect, it } from "vitest";
import { BANDS } from "@/config/bands";
import { mockResumeReview, mockSopReview } from "@/lib/ai/mock";
import { containsPercentChance, resumeReviewSchema, sopReviewSchema } from "@/lib/schemas";
import { resumeRequest, sopRequest } from "./fixtures/requests";

const validResume = () => structuredClone(mockResumeReview(resumeRequest));
const validSop = () => structuredClone(mockSopReview(sopRequest));

/** Collects every key name in a Zod object's JSON schema, recursively. */
function allKeys(node: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(node)) node.forEach((n) => allKeys(n, out));
  else if (node && typeof node === "object") {
    const props = (node as { properties?: Record<string, unknown> }).properties;
    if (props) Object.keys(props).forEach((k) => out.add(k));
    Object.values(node).forEach((v) => allKeys(v, out));
  }
  return out;
}

describe("resume review schema", () => {
  it("accepts a valid review", () => {
    expect(resumeReviewSchema.safeParse(validResume()).success).toBe(true);
  });

  it("rejects missing fields and out-of-range scores", () => {
    const missing = validResume() as Record<string, unknown>;
    delete missing.band;
    expect(resumeReviewSchema.safeParse(missing).success).toBe(false);

    const bad = validResume();
    bad.scores.clarity.score = 11;
    expect(resumeReviewSchema.safeParse(bad).success).toBe(false);
  });

  it("restricts band to the four bands", () => {
    expect([...BANDS]).toEqual(["Safety", "Target", "Reach", "High Reach"]);
    for (const band of ["Likely", "Safe", "90%", "", "reach"]) {
      expect(resumeReviewSchema.safeParse({ ...validResume(), band }).success, band).toBe(false);
    }
    for (const band of BANDS) {
      expect(resumeReviewSchema.safeParse({ ...validResume(), band }).success, band).toBe(true);
    }
  });

  it("has NO probability or percentage field", () => {
    const keys = [...allKeys(resumeReviewSchema.toJSONSchema()), ...allKeys(sopReviewSchema.toJSONSchema())];
    expect(keys.length).toBeGreaterThan(20);
    for (const k of keys) expect(k).not.toMatch(/prob|percent|chance|likelihood|odds/i);
  });

  it("strips an extra probability field the AI might add", () => {
    const parsed = resumeReviewSchema.parse({ ...validResume(), probability: 0.72, admitChancePercent: 72 });
    expect(parsed).not.toHaveProperty("probability");
    expect(parsed).not.toHaveProperty("admitChancePercent");
  });

  it("rejects text that states a percentage chance", () => {
    const r = validResume();
    r.bandExplanation = "You have a 65% chance of admission.";
    expect(resumeReviewSchema.safeParse(r).success).toBe(false);
    expect(containsPercentChance("probability of about 40 percent")).toBe(true);
    expect(containsPercentChance("Improve your score by 10% and add numbers")).toBe(false);
  });

  it("limits line feedback to 10 items and rewrites to one sentence", () => {
    const r = validResume();
    r.lineFeedback = Array.from({ length: 11 }, () => ({ ...validResume().lineFeedback[0]! }));
    expect(resumeReviewSchema.safeParse(r).success).toBe(false);

    const r2 = validResume();
    r2.lineFeedback[0]!.exampleRewrite = "First sentence. Second sentence. Third one.";
    expect(resumeReviewSchema.safeParse(r2).success).toBe(false);
  });

  it("requires 3–6 roadmap items", () => {
    const r = validResume();
    r.roadmap = r.roadmap.slice(0, 2);
    expect(resumeReviewSchema.safeParse(r).success).toBe(false);
  });
});

describe("SOP review schema", () => {
  it("accepts a valid review", () => {
    const result = sopReviewSchema.safeParse(validSop());
    expect(result.success).toBe(true);
    expect(validSop().highlights.length).toBeGreaterThan(0);
  });

  it("rejects unknown highlight types and bad scores", () => {
    const s = validSop();
    (s.highlights[0] as { type: string }).type = "boring";
    expect(sopReviewSchema.safeParse(s).success).toBe(false);

    const s2 = validSop();
    s2.scores.originality.score = -1;
    expect(sopReviewSchema.safeParse(s2).success).toBe(false);
  });

  it("finds consistency items only when a resume is given", () => {
    expect(validSop().consistencyCheck.length).toBeGreaterThan(0);
    expect(mockSopReview({ ...sopRequest, resumeText: "" }).consistencyCheck).toEqual([]);
  });
});
