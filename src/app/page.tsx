import Link from "next/link";
import { HeroIllustration } from "@/components/HeroIllustration";
import { BAND_INFO, BANDS, bandStyle } from "@/config/bands";

const STEPS = [
  {
    icon: "📄",
    title: "Upload your resume",
    text: "PDF, Word or pasted text. We show you exactly what was read before anything is sent.",
  },
  {
    icon: "🎯",
    title: "Pick your target",
    text: "Country, university, study level, course and how you plan to fund your studies.",
  },
  {
    icon: "🧭",
    title: "Get an honest review",
    text: "A competitiveness band, strengths, gaps, line-by-line feedback and a clear roadmap.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
        <div>
          <p className="mb-3 inline-block rounded-full bg-gold-soft px-3 py-1 text-sm font-medium text-gold">
            Free · No sign-up · Nothing stored
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            See your application the way admissions officers do <span aria-hidden>🎓</span>
          </h1>
          <p className="mt-4 max-w-prose text-lg text-muted">
            AdmitLens reviews your resume and statement of purpose against the university and
            country you are aiming for — and tells you honestly where you stand.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/review"
              className="rounded-xl bg-indigo px-6 py-3 text-center font-semibold text-on-indigo shadow-card transition hover:opacity-90"
            >
              Review my resume
            </Link>
            <Link
              href="/sop"
              className="rounded-xl border border-line bg-surface px-6 py-3 text-center font-semibold transition hover:bg-surface-2"
            >
              Review my SOP
            </Link>
          </div>
        </div>
        <HeroIllustration className="mx-auto w-full max-w-md" />
      </section>

      <section aria-labelledby="how-title" className="py-10">
        <h2 id="how-title" className="text-3xl font-semibold">
          How it works
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line bg-surface p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span aria-hidden className="text-2xl">
                  {s.icon}
                </span>
                <span className="text-sm font-semibold text-gold">Step {i + 1}</span>
              </div>
              <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="promise-title" className="py-10">
        <h2 id="promise-title" className="text-3xl font-semibold">
          Our honesty promise
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
            <h3 className="text-xl font-semibold">Bands, not fake percentages</h3>
            <p className="mt-2 text-muted">
              No AI can calculate your real chance of admission, so we never show a percentage.
              Instead you get a competitiveness band, a confidence level and the reasons behind it.
            </p>
            <ul className="mt-4 space-y-2">
              {BANDS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-sm font-semibold" style={bandStyle(b)}>
                    {BAND_INFO[b].icon} {b}
                  </span>
                  <span className="text-sm text-muted">{BAND_INFO[b].meaning}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
            <h3 className="text-xl font-semibold">A coach, not a ghostwriter</h3>
            <p className="mt-2 text-muted">
              Many universities treat AI-written essays as dishonest. AdmitLens explains what to
              improve and may show a one-sentence example — but it will never rewrite your whole
              resume or SOP. Your voice stays yours.
            </p>
            <h3 className="mt-6 text-xl font-semibold">Private by design</h3>
            <p className="mt-2 text-muted">
              Your document is sent to a free AI provider only to generate the review, then
              discarded. No accounts, no database, no logs of your text.
            </p>
            <h3 className="mt-6 text-xl font-semibold">Always verify</h3>
            <p className="mt-2 text-muted">
              Requirements, fees and scholarships change. Every fact about a university should be
              checked on its official website.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
