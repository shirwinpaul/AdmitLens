"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BANDS } from "@/config/bands";
import { useStoredString } from "@/hooks/useStoredString";
import { clearShortlist, removeFromShortlist, type ShortlistEntry } from "@/lib/shortlist";
import { STORAGE_KEYS } from "@/lib/storage";
import { BandBadge, Disclaimer } from "./results/BandBadge";

function parse(raw: string | null): ShortlistEntry[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Side-by-side comparison of every university checked in this browser. */
export function ShortlistView() {
  const [raw] = useStoredString(STORAGE_KEYS.shortlist);
  const list = useMemo(
    () => parse(raw).sort((a, b) => BANDS.indexOf(a.band) - BANDS.indexOf(b.band)),
    [raw],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">My university shortlist</h1>
          <p className="mt-1 text-muted">
            Every university you checked in this browser, safest first. Only results are saved — never your documents.
          </p>
        </div>
        <div className="no-print flex gap-2">
          <Link href="/review" className="rounded-xl bg-indigo px-4 py-2.5 text-sm font-semibold text-on-indigo">
            🎯 Check a university
          </Link>
          {list.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Remove all universities from your shortlist?")) clearShortlist();
              }}
              className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-4xl" aria-hidden>
            🗂️
          </p>
          <p className="mt-3 font-medium">Your shortlist is empty.</p>
          <p className="text-sm text-muted">Review your resume against a university and it will appear here.</p>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <Disclaimer />
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((e) => (
              <li key={e.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <BandBadge band={e.band} size="sm" />
                  <button
                    type="button"
                    onClick={() => removeFromShortlist(e.id)}
                    aria-label={`Remove ${e.university}`}
                    className="no-print rounded-lg px-2 text-muted hover:text-ink"
                  >
                    ✕
                  </button>
                </div>
                <h2 className="mt-3 wrap-break-word text-lg font-semibold">{e.university}</h2>
                <p className="text-sm text-muted">
                  {e.country} · {e.level}
                </p>
                <p className="text-sm text-muted">{e.course}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Confidence</dt>
                    <dd className="font-medium">{e.confidence}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Top gap</dt>
                    <dd className="font-medium">{e.topGap}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Funding plan</dt>
                    <dd className="text-right">{e.funding}</dd>
                  </div>
                </dl>
                <p className="mt-auto pt-4 text-xs text-muted">
                  Checked {new Date(e.checkedAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
