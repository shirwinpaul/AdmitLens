"use client";

import { useId } from "react";

interface Choice<T extends string> {
  value: T;
  label: string;
  icon: string;
  hint?: string;
}

interface Props<T extends string> {
  legend: string;
  choices: Choice<T>[];
  value: T | "";
  onChange: (v: T) => void;
}

/** Large, keyboard-friendly radio cards (native radios, styled). */
export function ChoiceCards<T extends string>({ legend, choices, value, onChange }: Props<T>) {
  const name = useId();
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {choices.map((c) => {
          const checked = value === c.value;
          return (
            <label
              key={c.value}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 bg-surface p-4 shadow-card transition has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-indigo ${
                checked ? "border-indigo bg-indigo-soft" : "border-line hover:border-indigo/50"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={c.value}
                checked={checked}
                onChange={() => onChange(c.value)}
                className="sr-only"
              />
              <span aria-hidden className="text-2xl">
                {c.icon}
              </span>
              <span>
                <span className="block font-semibold">{c.label}</span>
                {c.hint && <span className="mt-0.5 block text-sm text-muted">{c.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
