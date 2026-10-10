"use client";

import { useMemo, useState } from "react";
import { findCountry, OTHER_OPTIONS, POPULAR_OPTIONS } from "@/config/countries";
import { cleanTyping } from "@/lib/sanitize";
import { Combobox, type ComboOption } from "./Combobox";

const OTHER_VALUE = "__other__";

interface Props {
  value: string;
  onChange: (country: string) => void;
  autoFocus?: boolean;
}

export function CountrySelect({ value, onChange, autoFocus }: Props) {
  const isCustomValue = value !== "" && !findCountry(value);
  const [typing, setTyping] = useState(isCustomValue);

  const options = useMemo<ComboOption[]>(
    () => [
      ...POPULAR_OPTIONS.map((c) => ({ value: c.name, label: c.name, icon: c.flag, group: "Popular destinations" })),
      ...OTHER_OPTIONS.map((c) => ({ value: c.name, label: c.name, icon: c.flag, group: "All other countries" })),
      { value: OTHER_VALUE, label: "Other — type your country", icon: "✏️", group: "Other", sticky: true },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <Combobox
        label="Search for a country"
        placeholder="Start typing, e.g. Canada"
        options={options}
        value={typing ? OTHER_VALUE : value}
        autoFocus={autoFocus}
        onSelect={(o) => {
          if (o.value === OTHER_VALUE) {
            setTyping(true);
            onChange("");
          } else {
            setTyping(false);
            onChange(o.value);
          }
        }}
      />
      {typing && (
        <div>
          <label htmlFor="custom-country" className="mb-2 block font-medium">
            Type your country
          </label>
          <input
            id="custom-country"
            maxLength={60}
            value={value}
            onChange={(e) => onChange(cleanTyping(e.target.value, 60))}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3"
            placeholder="Your country"
          />
        </div>
      )}
    </div>
  );
}
