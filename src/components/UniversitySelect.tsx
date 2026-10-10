"use client";

import { useEffect, useMemo, useState } from "react";
import { findCountry } from "@/config/countries";
import { cleanTyping } from "@/lib/sanitize";
import { Combobox, type ComboOption } from "./Combobox";

const CUSTOM_VALUE = "__custom__";

interface Props {
  country: string;
  value: string;
  /** true when the student typed the name themselves */
  isCustom: boolean;
  onChange: (university: string, isCustom: boolean) => void;
}

type LoadState = { slug: string; status: "ok"; list: string[] } | { slug: string; status: "error" };

/** Loads only the chosen country's university list (public/data/universities/<slug>.json). */
export function UniversitySelect({ country, value, isCustom, onChange }: Props) {
  const slug = findCountry(country)?.slug ?? null;
  const [loaded, setLoaded] = useState<LoadState | null>(null);
  const [typing, setTyping] = useState(isCustom || !slug);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/data/universities/${slug}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<string[]>;
      })
      .then((list) => !cancelled && setLoaded({ slug, status: "ok", list }))
      .catch(() => !cancelled && setLoaded({ slug, status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const current = loaded && loaded.slug === slug ? loaded : null;
  const list = useMemo(() => (current?.status === "ok" ? current.list : []), [current]);

  const options = useMemo<ComboOption[]>(
    () => [
      ...list.map((name) => ({ value: name, label: name })),
      { value: CUSTOM_VALUE, label: "My university isn't listed — type it", icon: "✏️", sticky: true },
    ],
    [list],
  );

  return (
    <div className="space-y-4">
      {slug && !current && (
        <p role="status" className="text-sm text-muted">
          Loading universities in {country}…
        </p>
      )}
      {current?.status === "error" && (
        <p role="alert" className="rounded-xl bg-gold-soft px-3 py-2 text-sm">
          We couldn&apos;t load the university list. You can type your university name below.
        </p>
      )}
      {slug && current?.status === "ok" && (
        <>
          <p className="text-sm text-muted">{list.length.toLocaleString()} universities listed in {country}.</p>
          <Combobox
            label={`Search universities in ${country}`}
            placeholder="Start typing a university name"
            options={options}
            value={typing ? CUSTOM_VALUE : value}
            autoFocus
            onSelect={(o) => {
              if (o.value === CUSTOM_VALUE) {
                setTyping(true);
                onChange("", true);
              } else {
                setTyping(false);
                onChange(o.value, false);
              }
            }}
          />
        </>
      )}
      {(typing || !slug || current?.status === "error") && (
        <div>
          <label htmlFor="custom-uni" className="mb-2 block font-medium">
            Type your university name
          </label>
          <input
            id="custom-uni"
            maxLength={120}
            value={value}
            onChange={(e) => onChange(cleanTyping(e.target.value, 120), true)}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3"
            placeholder="University name (max 120 characters)"
          />
        </div>
      )}
    </div>
  );
}
