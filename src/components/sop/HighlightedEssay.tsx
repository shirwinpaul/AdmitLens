"use client";

import { useMemo, useState } from "react";
import { locateHighlights } from "@/lib/highlights";
import type { HighlightType, SopReview } from "@/lib/schemas";

type Highlight = SopReview["highlights"][number];

/** Tailwind classes per highlight type (light + dark, AA contrast on the text). */
export const HIGHLIGHT_STYLE: Record<HighlightType, { cls: string; icon: string }> = {
  "cliché": { cls: "bg-amber-100 text-amber-950 dark:bg-amber-900/60 dark:text-amber-50", icon: "🔁" },
  "vague claim": { cls: "bg-orange-100 text-orange-950 dark:bg-orange-900/60 dark:text-orange-50", icon: "🌫️" },
  "tell-don't-show": { cls: "bg-violet-100 text-violet-950 dark:bg-violet-900/60 dark:text-violet-50", icon: "🗣️" },
  repetition: { cls: "bg-sky-100 text-sky-950 dark:bg-sky-900/60 dark:text-sky-50", icon: "♻️" },
  "passive voice": { cls: "bg-pink-100 text-pink-950 dark:bg-pink-900/60 dark:text-pink-50", icon: "💤" },
  grammar: { cls: "bg-red-100 text-red-950 dark:bg-red-900/60 dark:text-red-50", icon: "✍️" },
  "strong line": { cls: "bg-green-100 text-green-950 dark:bg-green-900/60 dark:text-green-50", icon: "🌟" },
};

export function HighlightedEssay({ text, highlights }: { text: string; highlights: Highlight[] }) {
  const { segments, missing } = useMemo(() => locateHighlights(text, highlights), [text, highlights]);
  const [active, setActive] = useState<number | null>(null);
  const activeItem = active !== null ? highlights[active] : null;
  const usedTypes = [...new Set(highlights.map((h) => h.type))];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div>
        <ul className="mb-3 flex flex-wrap gap-2 text-xs" aria-label="Highlight colours">
          {usedTypes.map((t) => (
            <li key={t} className={`rounded-full px-2 py-0.5 font-medium ${HIGHLIGHT_STYLE[t].cls}`}>
              <span aria-hidden>{HIGHLIGHT_STYLE[t].icon}</span> {t}
            </li>
          ))}
        </ul>
        <div className="whitespace-pre-wrap rounded-2xl border border-line bg-surface p-5 leading-8 shadow-card">
          {segments.map((s, i) =>
            s.highlight ? (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setActive(s.highlight!.index)}
                onFocus={() => setActive(s.highlight!.index)}
                onClick={() => setActive(s.highlight!.index)}
                aria-label={`${s.highlight.item.type}: ${s.text}. ${s.highlight.item.comment}`}
                className={`inline cursor-pointer rounded px-0.5 text-left underline decoration-dotted underline-offset-4 ${
                  HIGHLIGHT_STYLE[s.highlight.item.type].cls
                } ${active === s.highlight.index ? "ring-2 ring-indigo" : ""}`}
              >
                {s.text}
              </button>
            ) : (
              <span key={i}>{s.text}</span>
            ),
          )}
        </div>
        <p className="no-print mt-2 text-xs text-muted">Hover, tap or tab to a highlight to see the comment.</p>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start" aria-live="polite">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          {activeItem ? (
            <HighlightCard h={activeItem} />
          ) : (
            <p className="text-sm text-muted">Select a highlighted phrase to see feedback here.</p>
          )}
        </div>
        {missing.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">More notes</p>
            <ul className="space-y-2">
              {missing.map(({ item, index }) => (
                <li key={index} className="rounded-xl border border-line bg-surface p-3">
                  <HighlightCard h={item} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* Print version: every highlight's comment as a list. */}
      <ol className="print-only space-y-2 lg:col-span-2">
        {highlights.map((h, i) => (
          <li key={i} className="print-break">
            <HighlightCard h={h} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function HighlightCard({ h }: { h: Highlight }) {
  return (
    <div className="text-sm">
      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${HIGHLIGHT_STYLE[h.type].cls}`}>
        <span aria-hidden>{HIGHLIGHT_STYLE[h.type].icon}</span> {h.type}
      </span>
      <blockquote className="mt-2 border-l-4 border-gold pl-2 italic">“{h.quote}”</blockquote>
      <p className="mt-2">{h.comment}</p>
      {h.exampleRewrite && h.type !== "strong line" && (
        <p className="mt-2 rounded-lg bg-indigo-soft px-2 py-1.5">
          <strong>Example idea:</strong> {h.exampleRewrite}
        </p>
      )}
    </div>
  );
}
