"use client";

import { useEffect, useRef, useState } from "react";
import { useStoredString } from "@/hooks/useStoredString";
import { STORAGE_KEYS } from "@/lib/storage";

/**
 * Bring-Your-Own-Key settings. The key lives only in this browser's localStorage and
 * is sent per request in a header; the server never stores or logs it.
 */
export function SettingsDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [savedKey, setSavedKey] = useStoredString(STORAGE_KEYS.geminiKey);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const open = () => {
      setDraft("");
      setStatus("");
      dialogRef.current?.showModal();
    };
    window.addEventListener("admitlens:open-settings", open);
    return () => window.removeEventListener("admitlens:open-settings", open);
  }, []);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const key = draft.trim();
    if (key.length < 20 || /\s/.test(key)) {
      setStatus("That doesn't look like a Gemini key. It is usually a long code starting with “AIza”.");
      return;
    }
    setSavedKey(key);
    setDraft("");
    setStatus("Saved in this browser only ✅");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("admitlens:open-settings"))}
        aria-label="Settings"
        title="Settings"
        className="grid h-9 w-9 shrink-0 place-items-center sm:h-10 sm:w-10 rounded-full border border-line bg-surface text-lg transition hover:bg-surface-2"
      >
        <span aria-hidden>⚙️</span>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="settings-title"
        className="m-auto w-[min(92vw,32rem)] rounded-2xl border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-black/50"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <form onSubmit={save} className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="settings-title" className="text-2xl font-semibold">
              Settings
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close settings"
              className="rounded-full px-2 text-xl text-muted hover:text-ink"
            >
              ✕
            </button>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Your own free Gemini key (optional)</h3>
            <p className="mt-1 text-sm text-muted">
              If our shared free AI is busy, you can use your own free key. It is stored only in this
              browser and sent with each review. Our server never saves or logs it.
            </p>
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>
              Open{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-indigo underline"
              >
                aistudio.google.com
              </a>{" "}
              and sign in with a Google account.
            </li>
            <li>Click “Create API key” and copy it.</li>
            <li>Paste it below and press Save.</li>
          </ol>
          <label className="block text-sm font-medium" htmlFor="byok-input">
            Gemini API key
          </label>
          <input
            id="byok-input"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={savedKey ? "•••••••• (a key is saved)" : "AIza…"}
            className="w-full rounded-xl border border-line bg-bg px-3 py-2.5"
          />
          <p aria-live="polite" className="min-h-5 text-sm text-indigo">
            {status || (savedKey ? "A personal key is saved in this browser." : "")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded-xl bg-indigo px-4 py-2 font-medium text-on-indigo">
              Save
            </button>
            {savedKey && (
              <button
                type="button"
                onClick={() => {
                  setSavedKey(null);
                  setStatus("Your key was removed from this browser.");
                }}
                className="rounded-xl border border-line px-4 py-2 font-medium"
              >
                Remove my key
              </button>
            )}
          </div>
        </form>
      </dialog>
    </>
  );
}
