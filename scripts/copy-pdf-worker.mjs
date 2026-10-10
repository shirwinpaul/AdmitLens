// Copies the pdf.js worker into /public so the browser can load it from the same origin.
// Runs automatically after `npm install` (postinstall) so it always matches the installed version.
import { copyFileSync, existsSync } from "node:fs";

const src = "node_modules/pdfjs-dist/build/pdf.worker.min.mjs";
if (existsSync(src)) {
  copyFileSync(src, "public/pdf.worker.min.mjs");
  console.log("Copied pdf.js worker to public/");
}
