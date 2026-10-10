/** Shortlist of checked universities — results only, never documents. */
import type { Band } from "@/config/bands";
import { readJSON, STORAGE_KEYS, writeJSON } from "./storage";

export interface ShortlistEntry {
  id: string;
  checkedAt: string;
  university: string;
  country: string;
  level: string;
  course: string;
  funding: string;
  band: Band;
  confidence: "Low" | "Medium" | "High";
  topGap: string;
}

export function entryId(e: Pick<ShortlistEntry, "university" | "country" | "level" | "course">) {
  return [e.university, e.country, e.level, e.course].map((s) => s.toLowerCase().trim()).join("|");
}

export function loadShortlist(): ShortlistEntry[] {
  const list = readJSON<ShortlistEntry[]>(STORAGE_KEYS.shortlist, []);
  return Array.isArray(list) ? list : [];
}

/** Adds or replaces (same university + level + course) — newest first, max 20. */
export function upsertShortlist(entry: Omit<ShortlistEntry, "id">) {
  const id = entryId(entry);
  const next = [{ ...entry, id }, ...loadShortlist().filter((e) => e.id !== id)].slice(0, 20);
  writeJSON(STORAGE_KEYS.shortlist, next);
}

export function removeFromShortlist(id: string) {
  writeJSON(STORAGE_KEYS.shortlist, loadShortlist().filter((e) => e.id !== id));
}

export function clearShortlist() {
  writeJSON(STORAGE_KEYS.shortlist, []);
}
