export const BANDS = ["Safety", "Target", "Reach", "High Reach"] as const;
export type Band = (typeof BANDS)[number];

export const BAND_INFO: Record<Band, { icon: string; meaning: string; cssVar: string }> = {
  Safety: {
    icon: "🟢",
    meaning: "Your profile is clearly above what this program typically looks for.",
    cssVar: "safety",
  },
  Target: {
    icon: "🟡",
    meaning: "Your profile is in line with typical admits.",
    cssVar: "target",
  },
  Reach: {
    icon: "🟠",
    meaning: "Possible, but your profile is below typical admits in some areas.",
    cssVar: "reach",
  },
  "High Reach": {
    icon: "🔴",
    meaning: "A very selective program and/or significant gaps in your profile.",
    cssVar: "high",
  },
};

export const BAND_DISCLAIMER =
  "This is an AI estimate based on general knowledge, not an official prediction. Admission decisions depend on many factors. Verify requirements on the university's official website.";

/** Inline style for a band's colour pair (uses theme-aware CSS variables). */
export function bandStyle(band: Band): React.CSSProperties {
  const v = BAND_INFO[band].cssVar;
  return { color: `var(--band-${v})`, backgroundColor: `var(--band-${v}-bg)` };
}
