import { describe, expect, it } from "vitest";
import { locateHighlights } from "@/lib/highlights";

const essay = "I love data. I love data science. Mistakes were made.";

describe("locateHighlights", () => {
  it("splits text into plain and highlighted segments that rebuild the original", () => {
    const { segments, missing } = locateHighlights(essay, [{ quote: "Mistakes were made." }, { quote: "I love data science." }]);
    expect(missing).toHaveLength(0);
    expect(segments.map((s) => s.text).join("")).toBe(essay);
    expect(segments.filter((s) => s.highlight).map((s) => s.text)).toEqual(["I love data science.", "Mistakes were made."]);
  });

  it("matches case-insensitively and strips surrounding quotes", () => {
    const { segments } = locateHighlights(essay, [{ quote: "“mistakes WERE made”" }]);
    expect(segments.find((s) => s.highlight)?.text).toBe("Mistakes were made");
  });

  it("does not overlap; a repeated phrase maps to the next occurrence", () => {
    const { segments } = locateHighlights(essay, [{ quote: "I love data" }, { quote: "I love data" }]);
    const marks = segments.filter((s) => s.highlight);
    expect(marks).toHaveLength(2);
    expect(marks[0]!.highlight!.start).not.toBe(marks[1]!.highlight!.start);
  });

  it("reports quotes that are not in the essay", () => {
    const { missing } = locateHighlights(essay, [{ quote: "Not in the essay" }]);
    expect(missing).toHaveLength(1);
  });
});
