"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export interface TabDef {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Accessible tabs (arrow keys, Home/End). Inactive panels stay in the DOM but hidden,
 * so "Download report" (print) can show every section.
 */
export function Tabs({ tabs, label }: { tabs: TabDef[]; label: string }) {
  const base = useId();
  const [active, setActive] = useState(tabs[0]?.id);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next >= 0) {
      e.preventDefault();
      setActive(tabs[next]!.id);
      refs.current[tabs[next]!.id]?.focus();
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="no-print -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 [scrollbar-width:thin]"
      >
        {tabs.map((t, i) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              id={`${base}-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${
                selected ? "border-indigo text-indigo" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <section
          key={t.id}
          id={`${base}-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${t.id}`}
          tabIndex={0}
          data-print-expand
          className={`pt-6 ${t.id === active ? "" : "hidden"}`}
        >
          <h2 className="print-only mb-3 mt-6 text-2xl font-semibold">{t.label}</h2>
          {t.content}
        </section>
      ))}
    </div>
  );
}
