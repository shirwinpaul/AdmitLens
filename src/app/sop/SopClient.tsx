"use client";

import dynamic from "next/dynamic";

// Reads saved answers from localStorage on first render, so it's client-only.
const SopFlow = dynamic(() => import("@/components/sop/SopFlow").then((m) => m.SopFlow), {
  ssr: false,
  loading: () => (
    <p role="status" className="mx-auto max-w-2xl px-4 py-16 text-center text-muted">
      Loading…
    </p>
  ),
});

export function SopClient() {
  return <SopFlow />;
}
