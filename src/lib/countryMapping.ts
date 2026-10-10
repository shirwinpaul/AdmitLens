/**
 * Maps country names used by the Hipo/university-domains-list dataset to the names
 * shown in the app. Shared by `scripts/fetch-universities.ts` and the tests.
 */
export const DATASET_TO_APP_COUNTRY: Record<string, string> = {
  "Bolivia, Plurinational State of": "Bolivia",
  "Brunei Darussalam": "Brunei",
  "Congo, the Democratic Republic of the": "DR Congo",
  Congo: "Republic of the Congo",
  "Czech Republic": "Czechia",
  "Holy See (Vatican City State)": "Vatican City",
  "Korea, Democratic People's Republic of": "North Korea",
  "Korea, Republic of": "South Korea",
  "Lao People's Democratic Republic": "Laos",
  Macao: "Macau",
  "Moldova, Republic of": "Moldova",
  "Palestine, State of": "Palestine",
  "Russian Federation": "Russia",
  Swaziland: "Eswatini",
  "Syrian Arab Republic": "Syria",
  "Taiwan, Province of China": "Taiwan",
  "Tanzania, United Republic of": "Tanzania",
  Turkiye: "Türkiye",
  "Venezuela, Bolivarian Republic of": "Venezuela",
  "Viet Nam": "Vietnam",
  "Virgin Islands, British": "British Virgin Islands",
};

export function mapDatasetCountry(name: string): string {
  const trimmed = name.trim();
  return DATASET_TO_APP_COUNTRY[trimmed] ?? trimmed;
}

/**
 * File-safe slug for a country's JSON file, e.g. "South Korea" → "south-korea",
 * "Côte d'Ivoire" → "cote-d-ivoire".
 */
export function countrySlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Deduplicate (case/space-insensitive) and sort university names alphabetically. */
export function dedupeAndSort(names: string[]): string[] {
  const seen = new Map<string, string>();
  for (const raw of names) {
    const name = raw.replace(/\s+/g, " ").trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase("en");
    if (!seen.has(key)) seen.set(key, name);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

/** Turns an ISO-3166 alpha-2 code into a flag emoji ("IN" → 🇮🇳). */
export function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "🏳️";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
