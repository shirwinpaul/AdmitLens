"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";

export interface ScoreRow {
  label: string;
  score: number;
  reason: string;
}

/**
 * Radar chart + accessible list of scores. Colours use `currentColor` so the chart
 * follows the theme (SVG attributes can't read CSS variables reliably).
 */
export function ScoreChart({ rows, title }: { rows: ScoreRow[]; title: string }) {
  const avg = rows.reduce((s, r) => s + r.score, 0) / Math.max(rows.length, 1);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <figure className="print-break">
        <div className="h-72 w-full text-indigo" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={rows} outerRadius="70%">
              <PolarGrid stroke="currentColor" strokeOpacity={0.25} />
              <PolarAngleAxis dataKey="label" tick={{ fill: "currentColor", fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={false} axisLine={false} />
              <Radar dataKey="score" stroke="currentColor" fill="currentColor" fillOpacity={0.3} isAnimationActive={false} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <figcaption className="text-center text-sm text-muted">
          {title} · average {avg.toFixed(1)} / 10
        </figcaption>
      </figure>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="print-break">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{r.label}</span>
              <span className="font-semibold tabular-nums">{r.score}/10</span>
            </div>
            <div
              className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2"
              role="meter"
              aria-label={r.label}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={r.score}
            >
              <div className="h-full rounded-full bg-indigo" style={{ width: `${r.score * 10}%` }} />
            </div>
            <p className="mt-1 text-sm text-muted">{r.reason}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
