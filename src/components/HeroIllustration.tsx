/** Original illustration: a globe with a graduation cap and orbiting documents. */
export function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 300"
      role="img"
      aria-labelledby="hero-ill-title"
      className={className}
    >
      <title id="hero-ill-title">A globe wearing a graduation cap, with documents orbiting it</title>
      <defs>
        <linearGradient id="globe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--indigo)" stopOpacity="0.95" />
          <stop offset="1" stopColor="#1b2560" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="160" rx="140" ry="44" fill="none" stroke="var(--gold)" strokeWidth="2" strokeDasharray="4 8" opacity="0.7" />
      <circle cx="160" cy="170" r="92" fill="url(#globe)" />
      {/* meridians & parallels */}
      <g fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.5">
        <ellipse cx="160" cy="170" rx="40" ry="92" />
        <ellipse cx="160" cy="170" rx="74" ry="92" />
        <line x1="68" y1="170" x2="252" y2="170" />
        <path d="M80 125 Q160 140 240 125" />
        <path d="M80 215 Q160 200 240 215" />
      </g>
      {/* abstract continents */}
      <g fill="#ffffff" fillOpacity="0.22">
        <path d="M118 130 q18 -14 34 -2 q8 10 -4 20 q-16 6 -22 18 q-14 -6 -8 -36z" />
        <path d="M178 182 q22 -10 34 6 q4 18 -14 28 q-18 2 -20 -16z" />
        <path d="M130 200 q10 -4 16 6 q-2 12 -14 10z" />
      </g>
      {/* graduation cap */}
      <g>
        <polygon points="160,52 236,82 160,110 84,82" fill="#0f1a3a" stroke="var(--gold)" strokeWidth="2" />
        <path d="M120 96 v22 q40 22 80 0 v-22 l-40 14z" fill="#0f1a3a" />
        <line x1="222" y1="86" x2="222" y2="128" stroke="var(--gold)" strokeWidth="3" />
        <circle cx="222" cy="132" r="6" fill="var(--gold)" />
      </g>
      {/* orbiting documents */}
      <g>
        <rect x="18" y="140" width="40" height="52" rx="6" fill="var(--surface)" stroke="var(--line)" />
        <line x1="26" y1="154" x2="50" y2="154" stroke="var(--indigo)" strokeWidth="3" strokeLinecap="round" />
        <line x1="26" y1="164" x2="46" y2="164" stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="172" x2="50" y2="172" stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round" />
        <rect x="262" y="176" width="40" height="52" rx="6" fill="var(--surface)" stroke="var(--line)" />
        <path d="M272 204 l7 7 l13 -16" fill="none" stroke="var(--band-safety)" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g fill="var(--gold)">
        <path d="M268 60 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3z" />
        <path d="M46 84 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z" />
      </g>
    </svg>
  );
}
