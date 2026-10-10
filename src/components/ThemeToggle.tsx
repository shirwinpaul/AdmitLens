"use client";

import { useSyncExternalStore } from "react";
import { STORAGE_KEYS, writeStorage } from "@/lib/storage";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    writeStorage(STORAGE_KEYS.theme, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="grid h-9 w-9 shrink-0 place-items-center sm:h-10 sm:w-10 rounded-full border border-line bg-surface text-lg transition hover:bg-surface-2"
    >
      <span aria-hidden>{isDark ? "☀️" : "🌙"}</span>
    </button>
  );
}

/** Inline script run before paint so there's no light→dark flash. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEYS.theme}");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})();`;
