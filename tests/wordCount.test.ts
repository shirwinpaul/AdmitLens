import { describe, expect, it } from "vitest";
import { countWords, wordLimitStatus } from "@/lib/wordCount";

describe("countWords", () => {
  it("handles empty and whitespace-only text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t ")).toBe(0);
  });

  it("counts simple sentences", () => {
    expect(countWords("I want to study data science.")).toBe(6);
  });

  it("counts hyphenated words and contractions once", () => {
    expect(countWords("A well-known, don't-stop attitude — isn't it?")).toBe(6);
  });

  it("ignores punctuation and counts numbers", () => {
    expect(countWords("Scored 95% in 2024 ... !!! — wow")).toBe(5);
  });

  it("works across newlines and non-English letters", () => {
    expect(countWords("Café résumé\nnaïve\n\nüber")).toBe(4);
  });
});

describe("wordLimitStatus", () => {
  it("reports limit status", () => {
    expect(wordLimitStatus(500, null)).toBe("none");
    expect(wordLimitStatus(400, 650)).toBe("under");
    expect(wordLimitStatus(600, 650)).toBe("near");
    expect(wordLimitStatus(700, 650)).toBe("over");
  });
});
