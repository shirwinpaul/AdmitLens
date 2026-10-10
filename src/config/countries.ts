import { flagEmoji } from "@/lib/countryMapping";
import { COUNTRY_LIST } from "./countryList";

/** Shown first, in exactly this order (spec §5 Step 2). */
export const POPULAR_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "Ireland",
  "Netherlands",
  "France",
  "Spain",
  "Italy",
  "Sweden",
  "Denmark",
  "Switzerland",
  "Hungary",
  "Singapore",
  "Hong Kong",
  "Japan",
  "South Korea",
  "New Zealand",
  "United Arab Emirates",
  "Malaysia",
] as const;

export interface CountryOption {
  name: string;
  flag: string;
  /** File slug under public/data/universities, or null if we have no list. */
  slug: string | null;
  popular: boolean;
}

const byName = new Map(COUNTRY_LIST.map((c) => [c.name, c]));

export const POPULAR_OPTIONS: CountryOption[] = POPULAR_COUNTRIES.map((name) => {
  const c = byName.get(name);
  return { name, flag: c ? flagEmoji(c.code) : "🏳️", slug: c?.slug ?? null, popular: true };
});

const popularSet = new Set<string>(POPULAR_COUNTRIES);

export const OTHER_OPTIONS: CountryOption[] = COUNTRY_LIST.filter((c) => !popularSet.has(c.name))
  .map((c) => ({ name: c.name, flag: flagEmoji(c.code), slug: c.slug, popular: false }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

export function findCountry(name: string): CountryOption | undefined {
  return POPULAR_OPTIONS.find((c) => c.name === name) ?? OTHER_OPTIONS.find((c) => c.name === name);
}
