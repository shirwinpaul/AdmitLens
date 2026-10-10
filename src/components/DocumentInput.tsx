"use client";

import { useId, useRef, useState } from "react";
import { MAX_FILE_MB } from "@/config/limits";
import { countWords } from "@/lib/wordCount";
import {
  ExtractionError,
  extractFromFile,
  fromPastedText,
  type ExtractedDocument,
} from "@/lib/extract";

export const PRIVACY_NOTE =
  "Your document is sent to a free AI provider only to generate this review. This app never stores it. Consider removing your phone number and address before uploading.";

interface Props {
  /** e.g. "resume" or "SOP" — used in labels */
  noun: string;
  value: ExtractedDocument | null;
  onChange: (doc: ExtractedDocument | null) => void;
  minChars?: number;
}

export function DocumentInput({ noun, value, onChange, minChars = 200 }: Props) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"upload" | "paste">(value?.source === "text" ? "paste" : "upload");
  const [pasted, setPasted] = useState(value?.source === "text" ? value.text : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      onChange(await extractFromFile(file));
    } catch (err) {
      onChange(null);
      setError(err instanceof ExtractionError ? err.message : "Something went wrong reading this file.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
      active ? "bg-surface shadow-card text-ink" : "text-muted hover:text-ink"
    }`;

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label={`How to add your ${noun}`} className="flex gap-1 rounded-xl bg-surface-2 p-1">
        <button type="button" role="tab" aria-selected={tab === "upload"} className={tabClass(tab === "upload")} onClick={() => setTab("upload")}>
          📎 Upload file
        </button>
        <button type="button" role="tab" aria-selected={tab === "paste"} className={tabClass(tab === "paste")} onClick={() => setTab("paste")}>
          📋 Paste text
        </button>
      </div>

      {tab === "upload" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files[0]);
          }}
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
            dragging ? "border-indigo bg-indigo-soft" : "border-line bg-surface"
          }`}
        >
          <p className="text-3xl" aria-hidden>
            📄
          </p>
          <p className="mt-2 font-medium">Drag &amp; drop your {noun} here</p>
          <p className="text-sm text-muted">PDF or Word (.docx), up to {MAX_FILE_MB} MB</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="mt-4 rounded-xl bg-indigo px-5 py-2.5 font-medium text-on-indigo disabled:opacity-60"
          >
            {busy ? "Reading your file…" : "Choose a file"}
          </button>
          <input
            ref={fileRef}
            id={`${id}-file`}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            aria-label={`Upload your ${noun}`}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div>
          <label htmlFor={`${id}-paste`} className="mb-2 block font-medium">
            Paste your {noun} text
          </label>
          <textarea
            id={`${id}-paste`}
            rows={10}
            value={pasted}
            onChange={(e) => {
              setPasted(e.target.value);
              onChange(e.target.value.trim() ? fromPastedText(e.target.value) : null);
            }}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 font-mono text-sm"
            placeholder={`Paste the full text of your ${noun} here…`}
          />
        </div>
      )}

      <div aria-live="polite">
        {error && (
          <p role="alert" className="rounded-xl bg-(--band-high-bg) px-4 py-3 text-sm text-(--band-high)">
            {error}
          </p>
        )}
      </div>

      {value && <DocumentPreview doc={value} minChars={minChars} />}

      <p className="flex gap-2 rounded-xl bg-gold-soft px-4 py-3 text-sm">
        <span aria-hidden>🔒</span>
        <span>{PRIVACY_NOTE}</span>
      </p>
    </div>
  );
}

function DocumentPreview({ doc, minChars }: { doc: ExtractedDocument; minChars: number }) {
  const words = countWords(doc.text);
  const tooShort = !doc.isScanned && doc.text.length < minChars;
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          ✅ {doc.fileName} <span className="text-sm font-normal text-muted">· {words.toLocaleString()} words read</span>
        </p>
      </div>
      {doc.isScanned && (
        <p className="mt-3 rounded-xl bg-gold-soft px-3 py-2 text-sm">
          This PDF looks like a scanned image, so we could read very little text. That&apos;s okay — our main AI
          (Gemini) can read scans directly. Note: our backup AI only reads text, so it won&apos;t work for this file
          if Gemini is busy.
        </p>
      )}
      {tooShort && (
        <p className="mt-3 rounded-xl bg-gold-soft px-3 py-2 text-sm">
          This looks very short. Please check the text below is your full document.
        </p>
      )}
      {doc.text && (
        <>
          <p className="mt-3 text-sm text-muted">Please check we read it correctly:</p>
          <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-xs leading-relaxed">
            {doc.text.slice(0, 4000)}
            {doc.text.length > 4000 ? "\n…" : ""}
          </pre>
        </>
      )}
    </div>
  );
}

/** True when a document is usable for review. */
export function isDocumentReady(doc: ExtractedDocument | null, minChars = 200): boolean {
  if (!doc) return false;
  return doc.isScanned || doc.text.length >= minChars;
}
