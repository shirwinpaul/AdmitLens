import Link from "next/link";
import { SettingsDialog } from "./SettingsDialog";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/review", label: "Resume" },
  { href: "/sop", label: "SOP" },
  { href: "/shortlist", label: "Shortlist" },
];

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-1 px-3 py-3 sm:gap-2 sm:px-4">
        <Link href="/" aria-label="AdmitLens home" className="flex shrink-0 items-center gap-2 font-serif text-xl font-semibold">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-indigo text-on-indigo">
            🎓
          </span>
          <span className="hidden min-[420px]:inline">AdmitLens</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-0.5 sm:gap-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-1.5 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink sm:px-3"
            >
              {n.label}
            </Link>
          ))}
          <ThemeToggle />
          <SettingsDialog />
        </nav>
      </div>
    </header>
  );
}
