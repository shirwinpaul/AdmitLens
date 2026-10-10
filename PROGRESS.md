# AdmitLens — Progress Log

Read `PROJECT_SPEC.md` + this file before continuing. Trust this file over guesses.

## Status
| Phase | Status |
|---|---|
| 1. Setup, config, env, theme, layout, landing, Settings (BYOK) | ✅ Done |
| 2. University data script + per-country JSON + comboboxes | ✅ Done |
| 3. Document upload: PDF/.docx/paste, extraction, preview, privacy note | ✅ Done |
| 4. Resume wizard Steps 1–8, validation, localStorage | ✅ Done |
| 5. AI layer: Gemini (PDF) + Groq fallback, BYOK, rate limit, Zod, MOCK_AI | ✅ Done |
| 6. Resume results + shortlist + PDF report | ✅ Done |
| 7. SOP reviewer with highlighted essay + consistency check | ✅ Done |
| 8. Polish: dark mode, animations, responsive, a11y, tests | ✅ Done |
| 9. README | ✅ Done |
| 10. End-to-end check with MOCK_AI=true | ✅ Done (51/52 checks; the 1 is a Playwright screenshot artefact) |

**All phases complete.** Next: user adds real keys and tests with real AI.

## Decisions
- Next.js 16.3 (App Router, Turbopack default), React 19.2, Tailwind v4 (CSS-first `@theme`), Zod 4, Vitest 5.
- `@types/node` pinned to ^22 (Vitest 5 peer requirement).
- AI models (checked on official docs, Oct 2026) in `src/config/ai.ts`:
  Gemini `gemini-3.8-flash` (free tier) primary; Groq `llama-3.3-70b-versatile` fallback.
- `MOCK_AI` only works when `NODE_ENV !== "production"`.
- Dark mode: `.dark` class on `<html>`, set pre-paint by an inline script; colours are CSS variables in `globals.css` (`--on-indigo` gives text contrast on indigo buttons in both themes).
- localStorage access only via `src/lib/storage.ts` (try/catch guarded) + `useSyncExternalStore` hooks.
- Removed scaffold `CLAUDE.md`; kept `AGENTS.md` (Next.js agent notes).

- University data: `npm run data:universities` runs `scripts/fetch-universities.mts` (Node type-stripping), writes 200 files to `public/data/universities/<slug>.json` + `src/config/countryList.ts` (generated, committed). Mapping lives in `src/lib/countryMapping.ts`.
- `Combobox` caps rendered rows at 80 (+ "keep typing") instead of full virtualisation — fast for 1,000+ items.
- `cleanTyping` (live input) vs `sanitizeShortText` (final value, trims/collapses) in `src/lib/sanitize.ts`.
- pdf.js worker is copied to `public/pdf.worker.min.mjs` by `scripts/copy-pdf-worker.mjs` (postinstall). ESLint ignores `public/**`.
- PDFs > 4 MB are reviewed from extracted text only (Vercel ~4.5 MB request limit); PDFs with < 150 chars of text are flagged "scanned" (Gemini only).
- All Zod schemas in `src/lib/schemas.ts`; output schemas have no probability field and a refine rejects any "NN% chance"-style text.
- Wizard (`src/components/wizard/ResumeWizard.tsx`) is rendered client-only via `next/dynamic` so saved answers load without hydration mismatch. Enter = Next via form submit + a document keydown fallback.
- AI layer: `src/lib/ai/runner.ts` (provider-agnostic fallback + 1 retry with validation error, 40 s per-call timeout, overall deadline = maxDuration−10 s), `providers.ts` (Gemini w/ inline PDF, Groq text), `review.ts` (key selection: BYOK header > env key; Groq skipped when no extracted text), `mock.ts`. Routes `/api/review` (multipart: payload JSON + optional pdf) and `/api/sop` (JSON), `maxDuration = 120`.
- Fallback on ANY provider error (superset of spec: 429/5xx/timeout/invalid JSON) — friendlier when a key is wrong.
- Rate limit 15/hour/IP in memory (skipped in mock mode). Logs contain only provider/outcome/status — never text or keys.
- Upload limits in `src/config/limits.ts` (so server code never imports pdf.js).
- Results: tabs keep inactive panels in the DOM (hidden) and `[data-print-expand]` shows all of them when printing → "Download report" = `window.print()`.
- Every successful resume review is auto-added to the shortlist (deduped by university+country+level+course). "Check another university" reopens the wizard at Step 3 keeping the resume.
- SOP highlights located by `src/lib/highlights.ts` (exact, then case-insensitive; unmatched quotes shown as "More notes"). Comment panel updates on hover/focus/tap.
- SOP form fields (not essay) saved in localStorage and pre-filled from the resume wizard answers.
- Phase 8 fixes found via E2E: mobile header overflow at 360px; combobox opened on focus and covered Next (now opens on click/typing/arrows); StrictMode double-effect focused the heading on load; English search aliases (munich→münchen etc.) in `src/lib/search.ts`.
- Phase 10 E2E (Playwright, run from a scratch folder, not a project dependency): dev server started with `MOCK_AI=true` as a shell variable — `.env.local` keeps `MOCK_AI=false`. Verified full resume flow with `tests/fixtures/fake-resume.pdf`, all 8 result tabs, no "%" anywhere, print report, check-another/change-target, shortlist, SOP highlights/word count/consistency, dark mode persistence, BYOK dialog, no horizontal scroll at 360px on all pages. The only "failure" was a hydration warning caused by Playwright injecting caret-color during a screenshot; a clean browsing run showed 0 console errors.

## Commands
`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run check` (all four).

## Audit — 2026-10-08
Re-checked the code against Section 13. All 10 phases are present in the code, so nothing needed rebuilding.
`npm run check` passes: typecheck, lint, 51/51 tests, production build. The dev server stays up and `/`, `/review`, `/sop` and `/shortlist` all return 200.
200 university JSON files are in place. `.env.local` exists with `MOCK_AI=false`; only that line was checked, the rest of the file was not opened.

## Audit — 2026-10-11
Re-audited the code against Section 13: all 10 phases are present (routes, wizard, AI layer with fallback/BYOK/rate limit/mock, results, shortlist, SOP reviewer, README, 200 university files, fixtures). Nothing needed changing.
`npm run check` passes (typecheck, lint, 51/51 tests, build). Dev server stays up; `/`, `/review`, `/sop`, `/shortlist` and a university JSON all return 200. `.env.local` exists with `MOCK_AI=false` (only that line checked).
