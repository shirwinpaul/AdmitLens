"use client";

import { useDeferredValue, useId, useMemo, useRef, useState } from "react";
import { expandQuery, matchesQuery, normaliseForSearch } from "@/lib/search";

export interface ComboOption {
  value: string;
  label: string;
  icon?: string;
  group?: string;
  /** Special options (e.g. "type it yourself") are always shown, never filtered out. */
  sticky?: boolean;
}

interface Props {
  label: string;
  options: ComboOption[];
  value: string;
  onSelect: (option: ComboOption) => void;
  placeholder?: string;
  /** Max rows rendered at once — keeps typing instant for lists of 1,000+ items. */
  maxRendered?: number;
  emptyText?: string;
  autoFocus?: boolean;
}

/** Accessible, searchable combobox (WAI-ARIA 1.2 pattern) with optional groups. */
export function Combobox({
  label,
  options,
  value,
  onSelect,
  placeholder,
  maxRendered = 80,
  emptyText = "No matches",
  autoFocus,
}: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const listRef = useRef<HTMLUListElement>(null);

  // Pre-normalise once so each keystroke is a cheap substring check.
  const indexed = useMemo(() => options.map((o) => ({ o, key: normaliseForSearch(o.label) })), [options]);

  const { shown, total } = useMemo(() => {
    const variants = expandQuery(deferredQuery);
    const matches = indexed.filter((x) => x.o.sticky || matchesQuery(x.key, variants));
    const regular = matches.filter((x) => !x.o.sticky).map((x) => x.o);
    const sticky = matches.filter((x) => x.o.sticky).map((x) => x.o);
    return { shown: [...regular.slice(0, maxRendered), ...sticky], total: regular.length };
  }, [deferredQuery, indexed, maxRendered]);

  const activeIndex = Math.min(active, Math.max(shown.length - 1, 0));

  function choose(o: ComboOption) {
    onSelect(o);
    setQuery("");
    setOpen(false);
  }

  function scrollTo(i: number) {
    listRef.current?.querySelector(`[data-idx="${i}"]`)?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const next =
        e.key === "ArrowDown" ? Math.min(activeIndex + 1, shown.length - 1) : Math.max(activeIndex - 1, 0);
      setActive(next);
      scrollTo(next);
    } else if (e.key === "Enter" && open && shown[activeIndex]) {
      e.preventDefault();
      e.stopPropagation();
      choose(shown[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <label htmlFor={`${id}-input`} className="mb-2 block font-medium">
        {label}
      </label>
      {selected && !selected.sticky && !open && (
        <p className="mb-2 rounded-xl bg-indigo-soft px-3 py-2 text-sm">
          Selected:{" "}
          <strong>
            {selected.icon ? `${selected.icon} ` : ""}
            {selected.label}
          </strong>
        </p>
      )}
      <input
        id={`${id}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && shown[activeIndex] ? `${id}-opt-${activeIndex}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onClick={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base shadow-card"
      />
      {open && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-line bg-surface py-1 shadow-card"
        >
          {shown.length === 0 && <li className="px-4 py-3 text-sm text-muted">{emptyText}</li>}
          {shown.map((o, i) => {
            const header = o.group && o.group !== shown[i - 1]?.group ? o.group : null;
            return (
              <li key={`${o.group ?? ""}-${o.value}`} role="presentation">
                {header && (
                  <div className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-gold">
                    {header}
                  </div>
                )}
                <div
                  id={`${id}-opt-${i}`}
                  data-idx={i}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center gap-2 px-4 py-2.5 ${
                    i === activeIndex ? "bg-indigo-soft" : ""
                  } ${o.sticky ? "font-medium text-indigo" : ""}`}
                >
                  {o.icon && <span aria-hidden>{o.icon}</span>}
                  <span>{o.label}</span>
                </div>
              </li>
            );
          })}
          {total > maxRendered && (
            <li role="presentation" className="px-4 py-2 text-xs text-muted">
              Showing {maxRendered} of {total} — keep typing to narrow down.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
