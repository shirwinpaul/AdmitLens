import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { POPULAR_COUNTRIES, POPULAR_OPTIONS } from "@/config/countries";
import { COUNTRY_LIST } from "@/config/countryList";
import { countrySlug, dedupeAndSort, flagEmoji, mapDatasetCountry } from "@/lib/countryMapping";
import { cleanTyping, sanitizeShortText } from "@/lib/sanitize";

describe("dataset country mapping", () => {
  it("maps awkward dataset names to app names", () => {
    expect(mapDatasetCountry("Korea, Republic of")).toBe("South Korea");
    expect(mapDatasetCountry("Russian Federation")).toBe("Russia");
    expect(mapDatasetCountry("Viet Nam")).toBe("Vietnam");
    expect(mapDatasetCountry("Taiwan, Province of China")).toBe("Taiwan");
  });

  it("leaves already-friendly names unchanged", () => {
    expect(mapDatasetCountry("United States")).toBe("United States");
    expect(mapDatasetCountry("  Germany ")).toBe("Germany");
  });

  it("builds file-safe slugs", () => {
    expect(countrySlug("South Korea")).toBe("south-korea");
    expect(countrySlug("Côte d'Ivoire")).toBe("cote-d-ivoire");
  });

  it("deduplicates and sorts university names", () => {
    expect(dedupeAndSort(["Zeta Uni", "alpha  College", "Alpha College", " ", "Beta"])).toEqual([
      "alpha College",
      "Beta",
      "Zeta Uni",
    ]);
  });

  it("makes flag emojis from ISO codes", () => {
    expect(flagEmoji("IN")).toBe("🇮🇳");
    expect(flagEmoji("??")).toBe("🏳️");
  });
});

describe("generated university data", () => {
  it("has a list file for every popular destination", () => {
    expect(POPULAR_OPTIONS.map((c) => c.name)).toEqual([...POPULAR_COUNTRIES]);
    for (const c of POPULAR_OPTIONS) {
      expect(c.slug, c.name).not.toBeNull();
      const file = path.join(process.cwd(), "public/data/universities", `${c.slug}.json`);
      expect(existsSync(file), file).toBe(true);
    }
  });

  it("contains no raw dataset names that should have been mapped", () => {
    const names = COUNTRY_LIST.map((c) => c.name);
    expect(names).not.toContain("Korea, Republic of");
    expect(names).toContain("South Korea");
    const list = JSON.parse(
      readFileSync(path.join(process.cwd(), "public/data/universities/south-korea.json"), "utf8"),
    ) as string[];
    expect(list.length).toBeGreaterThan(50);
    expect([...list].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))).toEqual(list);
  });
});

describe("text sanitising", () => {
  it("cleans and limits short text", () => {
    expect(sanitizeShortText("  <b>My   Uni</b>\n", 120)).toBe("b My Uni /b");
    expect(sanitizeShortText("x".repeat(200)).length).toBe(120);
  });
  it("keeps spaces while typing", () => {
    expect(cleanTyping("Indian ")).toBe("Indian ");
  });
});

describe("university search aliases", async () => {
  const { expandQuery, matchesQuery, normaliseForSearch } = await import("@/lib/search");
  it("finds German names from English searches", () => {
    const label = normaliseForSearch("Technische Universität München");
    expect(matchesQuery(label, expandQuery("munich"))).toBe(true);
    expect(matchesQuery(label, expandQuery("Technical University of Munich"))).toBe(false); // "of" isn't in the name
    expect(matchesQuery(label, expandQuery("technical university munich".replace(" munich", "")))).toBe(true);
    expect(matchesQuery(normaliseForSearch("Universität zu Köln"), expandQuery("Cologne"))).toBe(true);
  });
  it("matches everything for an empty query", () => {
    expect(matchesQuery("anything", expandQuery("  "))).toBe(true);
  });
});
