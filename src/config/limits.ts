/** Upload limits shared by the browser and the API routes. */

/**
 * Vercel caps request bodies at ~4.5 MB. A 3 MB file plus the extracted text (≤ 60k chars)
 * and form overhead stays around 3.3 MB, safely under that cap.
 */
export const MAX_FILE_MB = 3;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
/** PDFs are sent to Gemini as files; same cap as any upload. */
export const MAX_PDF_UPLOAD_BYTES = MAX_FILE_BYTES;

export const FILE_TOO_LARGE_MESSAGE = `This file is larger than ${MAX_FILE_MB} MB. Please compress it, upload a smaller file, or paste the text instead.`;
