import "server-only";
import { AI_CONFIG, isRealKey } from "@/config/ai";
import { buildResumeUserPrompt, buildSopUserPrompt, RESUME_SYSTEM_PROMPT, SOP_SYSTEM_PROMPT } from "@/lib/prompts";
import { resumeReviewSchema, sopReviewSchema, type ResumeRequest, type SopRequest } from "@/lib/schemas";
import { geminiProvider, groqProvider } from "./providers";
import { runWithFallback, type AIProvider } from "./runner";

export class NoProviderConfiguredError extends Error {}

interface Keys {
  /** BYOK key from the request header — preferred over the server's Gemini key. */
  userGeminiKey?: string | null;
}

function geminiKey(keys: Keys): string | null {
  if (isRealKey(keys.userGeminiKey)) return keys.userGeminiKey.trim();
  const env = process.env[AI_CONFIG.gemini.envKey];
  return isRealKey(env) ? env.trim() : null;
}

function groqKey(): string | null {
  const env = process.env[AI_CONFIG.groq.envKey];
  return isRealKey(env) ? env.trim() : null;
}

export async function reviewResume(
  req: ResumeRequest,
  opts: Keys & { pdfBase64?: string; deadline: number },
) {
  const providers: AIProvider[] = [];
  const gKey = geminiKey(opts);
  if (gKey) {
    providers.push(geminiProvider(gKey, opts.pdfBase64 ? { base64: opts.pdfBase64 } : undefined));
  }
  // Groq is text-only: it can only help when we have extracted text (not for scans).
  const qKey = groqKey();
  if (qKey && req.documentText.trim().length >= 100) providers.push(groqProvider(qKey));
  if (providers.length === 0) throw new NoProviderConfiguredError();

  // Gemini may get the PDF-attached prompt; the text-only fallback gets the text prompt.
  // (Swapping the prefix keeps any retry note the runner appended.)
  const geminiUser = buildResumeUserPrompt(req, { pdfAttached: Boolean(opts.pdfBase64) });
  const textUser = buildResumeUserPrompt(req, { pdfAttached: false });
  const routed: AIProvider[] = providers.map((p) =>
    p.name === "gemini" ? p : { name: p.name, call: (input) => p.call({ ...input, user: input.user.replace(geminiUser, () => textUser) }) },
  );

  return runWithFallback({
    providers: routed,
    schema: resumeReviewSchema,
    system: RESUME_SYSTEM_PROMPT,
    user: geminiUser,
    deadline: opts.deadline,
  });
}

export async function reviewSop(req: SopRequest, wordCount: number, opts: Keys & { deadline: number }) {
  const providers: AIProvider[] = [];
  const gKey = geminiKey(opts);
  if (gKey) providers.push(geminiProvider(gKey));
  const qKey = groqKey();
  if (qKey) providers.push(groqProvider(qKey));
  if (providers.length === 0) throw new NoProviderConfiguredError();

  return runWithFallback({
    providers,
    schema: sopReviewSchema,
    system: SOP_SYSTEM_PROMPT,
    user: buildSopUserPrompt(req, wordCount),
    deadline: opts.deadline,
  });
}
