"use client";

import dynamic from "next/dynamic";

// The flow reads localStorage on first render, so it's rendered client-only.
const ReviewFlow = dynamic(() => import("@/components/review/ReviewFlow").then((m) => m.ReviewFlow), {
  ssr: false,
  loading: () => (
    <p role="status" className="mx-auto max-w-2xl px-4 py-16 text-center text-muted">
      Loading…
    </p>
  ),
});

export function ReviewClient() {
  return <ReviewFlow />;
}
