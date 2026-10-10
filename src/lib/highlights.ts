/**
 * Splits an essay into plain and highlighted segments using the AI's exact quotes.
 * Matching is exact first, then case-insensitive. Overlapping matches are skipped,
 * and quotes that can't be found are returned separately so nothing is lost.
 */
export interface Located<T> {
  start: number;
  end: number;
  item: T;
  index: number;
}

export type Segment<T> = { text: string; highlight?: Located<T> };

export function locateHighlights<T extends { quote: string }>(text: string, items: T[]) {
  const lower = text.toLowerCase();
  const found: Located<T>[] = [];
  const missing: { item: T; index: number }[] = [];

  items.forEach((item, index) => {
    const quote = item.quote.trim().replace(/^["“”']+|["“”']+$/g, "");
    if (quote.length < 3) return missing.push({ item, index });
    // Search past already-used ranges so repeated phrases map to different spots.
    let from = 0;
    while (from <= text.length) {
      let start = text.indexOf(quote, from);
      if (start < 0) start = lower.indexOf(quote.toLowerCase(), from);
      if (start < 0) break;
      const end = start + quote.length;
      if (!found.some((f) => start < f.end && end > f.start)) {
        found.push({ start, end, item, index });
        return;
      }
      from = start + 1;
    }
    missing.push({ item, index });
  });

  found.sort((a, b) => a.start - b.start);
  const segments: Segment<T>[] = [];
  let cursor = 0;
  for (const f of found) {
    if (f.start > cursor) segments.push({ text: text.slice(cursor, f.start) });
    segments.push({ text: text.slice(f.start, f.end), highlight: f });
    cursor = f.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return { segments, missing };
}
