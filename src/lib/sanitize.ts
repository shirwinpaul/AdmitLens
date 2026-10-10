/**
 * Cleans short free-text fields (university name, country, course…): removes control
 * characters and angle brackets, collapses whitespace and enforces a max length.
 */
export function sanitizeShortText(input: string, maxLength = 120): string {
  return input
    .replace(/[\u0000-\u001f\u007f<>`{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Cleans long document text: strips control chars except newlines/tabs, caps length. */
export function sanitizeDocumentText(input: string, maxLength = 60_000): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, maxLength);
}

/** Live-typing version: removes unsafe characters but keeps spaces so words can be typed. */
export function cleanTyping(input: string, maxLength = 120): string {
  return input.replace(/[\u0000-\u001f\u007f<>`{}]/g, "").slice(0, maxLength);
}
