/**
 * Search helpers for the comboboxes. The university dataset often uses local-language
 * names ("Technische Universität München"), so common English words are expanded to
 * their local equivalents before matching.
 */
export function normaliseForSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss");
}

/** English term → local-language spellings found in the dataset (already normalised). */
const ALIASES: Record<string, string[]> = {
  munich: ["munchen"],
  cologne: ["koln"],
  vienna: ["wien"],
  nuremberg: ["nurnberg"],
  frankfurt: ["frankfurt"],
  milan: ["milano"],
  rome: ["roma"],
  turin: ["torino"],
  florence: ["firenze"],
  naples: ["napoli"],
  venice: ["venezia"],
  padua: ["padova"],
  lisbon: ["lisboa"],
  zurich: ["zurich"],
  geneva: ["geneve"],
  prague: ["praha"],
  warsaw: ["warszawa"],
  copenhagen: ["kobenhavn"],
  gothenburg: ["goteborg"],
  technical: ["technische", "technical", "tecnica", "technique"],
  university: ["universitat", "universite", "universita", "universidad", "universidade", "universiteit", "university", "hochschule"],
};

/** Returns alternative normalised queries: the query itself plus alias-substituted versions. */
export function expandQuery(query: string): string[] {
  const q = normaliseForSearch(query.trim());
  if (!q) return [];
  const variants = new Set([q]);
  for (const [en, locals] of Object.entries(ALIASES)) {
    if (!q.includes(en)) continue;
    for (const v of [...variants]) for (const local of locals) variants.add(v.replace(en, local));
  }
  return [...variants];
}

export function matchesQuery(normalisedLabel: string, variants: string[]): boolean {
  return variants.length === 0 || variants.some((v) => normalisedLabel.includes(v));
}
