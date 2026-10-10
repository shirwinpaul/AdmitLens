/** Upload limits shared by the browser and the API routes. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
/**
 * Serverless platforms cap request bodies (~4.5 MB on Vercel), so PDFs larger than this
 * are reviewed from their extracted text instead of being sent as a file.
 */
export const MAX_PDF_UPLOAD_BYTES = 4 * 1024 * 1024;
