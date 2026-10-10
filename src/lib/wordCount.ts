/**
 * Counts words the way most application portals do: sequences of letters/numbers,
 * with hyphenated and apostrophe words ("well-known", "don't") counted once.
 */
export function countWords(text: string): number {
  const matches = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);
  return matches ? matches.length : 0;
}

export type WordLimitStatus = "none" | "under" | "near" | "over";

/** "near" = within the last 10% of the limit. */
export function wordLimitStatus(count: number, limit?: number | null): WordLimitStatus {
  if (!limit || limit <= 0) return "none";
  if (count > limit) return "over";
  if (count >= limit * 0.9) return "near";
  return "under";
}
