import "server-only";
import { ApiError, GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { AI_CONFIG } from "@/config/ai";
import { ProviderHttpError, type AIProvider } from "./runner";

/** Status code from SDK errors, if any (never logs messages, which could echo input). */
function statusOf(err: unknown): number | undefined {
  if (err instanceof ApiError) return err.status;
  if (err && typeof err === "object" && "status" in err && typeof err.status === "number") return err.status;
  return undefined;
}

/**
 * Gemini: reads PDFs natively, so the original PDF is attached when available.
 * `pdf` is held in memory for this request only.
 */
export function geminiProvider(apiKey: string, pdf?: { base64: string }): AIProvider {
  const ai = new GoogleGenAI({ apiKey });
  return {
    name: "gemini",
    async call({ system, user, signal }) {
      try {
        const parts = pdf
          ? [{ inlineData: { mimeType: "application/pdf", data: pdf.base64 } }, { text: user }]
          : [{ text: user }];
        const res = await ai.models.generateContent({
          model: AI_CONFIG.gemini.model,
          contents: [{ role: "user", parts }],
          config: {
            systemInstruction: system,
            responseMimeType: "application/json",
            temperature: AI_CONFIG.gemini.temperature,
            abortSignal: signal,
          },
        });
        return res.text ?? "";
      } catch (err) {
        const status = statusOf(err);
        if (status) throw new ProviderHttpError("gemini", status);
        throw err;
      }
    },
  };
}

/** Groq: text-only fallback — uses the text extracted in the browser. */
export function groqProvider(apiKey: string): AIProvider {
  const groq = new Groq({ apiKey, maxRetries: 0, timeout: AI_CONFIG.timeoutMs });
  return {
    name: "groq",
    async call({ system, user, signal }) {
      try {
        const res = await groq.chat.completions.create(
          {
            model: AI_CONFIG.groq.model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            response_format: { type: "json_object" },
            temperature: AI_CONFIG.groq.temperature,
            max_tokens: AI_CONFIG.groq.maxTokens,
          },
          { signal },
        );
        return res.choices[0]?.message?.content ?? "";
      } catch (err) {
        const status = statusOf(err);
        if (status) throw new ProviderHttpError("groq", status);
        throw err;
      }
    },
  };
}
