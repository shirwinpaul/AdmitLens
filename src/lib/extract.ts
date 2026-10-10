/**
 * Browser-side text extraction. Documents never leave the browser here — this only
 * turns a file into text so the student can preview it (and so the text-only fallback
 * model has something to read).
 */
import { FILE_TOO_LARGE_MESSAGE, MAX_FILE_BYTES } from "@/config/limits";
import { sanitizeDocumentText } from "./sanitize";

/** A PDF with fewer characters than this is probably a scanned image. */
export const SCANNED_TEXT_THRESHOLD = 150;

export type DocSource = "pdf" | "docx" | "text";

export interface ExtractedDocument {
  source: DocSource;
  fileName: string;
  text: string;
  /** The original PDF, kept in memory only so Gemini can read it directly. */
  pdfFile?: File;
  /** PDF with almost no extractable text (likely a scan). */
  isScanned: boolean;
}

export class ExtractionError extends Error {}

export function detectKind(file: File): "pdf" | "docx" | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  )
    return "docx";
  return null;
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker is copied to /public by scripts/copy-pdf-worker.mjs (postinstall).
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  const pdf = await task.promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let line = "";
    const lines: string[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = "";
      } else if (item.str && !item.str.endsWith(" ")) {
        line += " ";
      }
    }
    if (line) lines.push(line);
    pages.push(lines.map((l) => l.replace(/[ \t]+/g, " ").trim()).join("\n"));
  }
  await task.destroy();
  return pages.join("\n\n");
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

export async function extractFromFile(file: File): Promise<ExtractedDocument> {
  if (file.size > MAX_FILE_BYTES) {
    throw new ExtractionError(FILE_TOO_LARGE_MESSAGE);
  }
  const kind = detectKind(file);
  if (!kind) {
    throw new ExtractionError("Please upload a PDF or Word (.docx) file, or paste your text instead.");
  }
  try {
    if (kind === "pdf") {
      const text = sanitizeDocumentText(await extractPdfText(file));
      return {
        source: "pdf",
        fileName: file.name,
        text,
        pdfFile: file,
        isScanned: text.replace(/\s/g, "").length < SCANNED_TEXT_THRESHOLD,
      };
    }
    const text = sanitizeDocumentText(await extractDocxText(file));
    if (!text) throw new ExtractionError("We couldn't find any text in this Word file. Try pasting the text instead.");
    return { source: "docx", fileName: file.name, text, isScanned: false };
  } catch (err) {
    if (err instanceof ExtractionError) throw err;
    throw new ExtractionError(
      "We couldn't read this file. It may be password-protected or damaged — try another file or paste the text.",
    );
  }
}

export function fromPastedText(text: string): ExtractedDocument {
  return { source: "text", fileName: "Pasted text", text: sanitizeDocumentText(text), isScanned: false };
}
