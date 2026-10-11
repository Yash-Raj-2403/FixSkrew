import { ApiError, GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { z } from "zod/v4";
import { config } from "../config.js";
import { LlmError, LlmUnavailableError, type LlmProvider } from "./types.js";

let client: GoogleGenAI | null = null;
const getClient = () => (client ??= new GoogleGenAI({ apiKey: config.gemini.apiKey }));

/** Name the model and the limit that was hit, from Gemini's 429 body (e.g. " (gemini-3-flash, per-day free-tier limit, retry in 32s)"). */
function quotaDetail(message: string): string {
  const model = message.match(/"model":\s*"([^"]+)"/)?.[1] ?? message.match(/model:\s*([\w.-]+)/)?.[1];
  const id = message.match(/"quotaId":\s*"([^"]+)"/)?.[1] ?? message.match(/quotaId[":\s]+([\w-]+)/)?.[1] ?? "";
  const window = /PerDay/i.test(id) ? "per-day" : /PerMinute/i.test(id) ? "per-minute" : "";
  const tier = /FreeTier/i.test(id) ? "free-tier" : "";
  const retry = message.match(/retry in ([\d.]+)s/i)?.[1] ?? message.match(/"retryDelay":\s*"(\d+)s"/)?.[1];
  const parts = [model, [window, tier, id && "limit"].filter(Boolean).join(" "), retry && `retry in ${Math.ceil(Number(retry))}s`].filter(Boolean);
  return parts.length ? ` (${parts.join(", ")})` : "";
}

function wrap(err: unknown): never {
  if (err instanceof LlmError) throw err;
  if (err instanceof ApiError) {
    console.error("[gemini]", err.status, err.message.slice(0, 300));
    if (err.status === 429) throw new LlmUnavailableError(`The language model quota or rate limit was reached${quotaDetail(err.message)}. Try again shortly.`, true);
    if (err.status === 401 || err.status === 403)
      throw new LlmUnavailableError("The Gemini API key was rejected (access denied for this key or project). Replace GEMINI_API_KEY in backend/.env with a valid key and restart the backend.", false);
    throw new LlmUnavailableError("The language model request failed. Check the diagnostic service logs.", false);
  }
  throw err;
}

const RETRYABLE = new Set([500, 502, 503, 504]);

/** Retry transient Gemini failures (overload, rate limits) with jittered backoff. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof ApiError) || !RETRYABLE.has(err.status) || i >= attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 800 * 2 ** i + Math.random() * 400));
    }
  }
}

/** Throw when Gemini blocked or truncated the response instead of finishing normally. */
function checkFinish(r: GenerateContentResponse) {
  if (r.promptFeedback?.blockReason) throw new LlmError("The language model declined this request.");
  const reason = r.candidates?.[0]?.finishReason;
  if (reason === "SAFETY" || reason === "PROHIBITED_CONTENT" || reason === "BLOCKLIST" || reason === "RECITATION")
    throw new LlmError("The language model declined this request.");
  if (reason === "MAX_TOKENS") throw new LlmError("The output was cut off before completion.");
}

/** zod -> JSON Schema for Gemini's responseJsonSchema (drops the $schema marker). */
function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _omit, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

export const geminiProvider: LlmProvider = {
  name: "gemini",
  model: (tier) => (tier === "fast" ? config.llm.fastModel : config.llm.model),

  async structured({ system, user, schema, tier, images }) {
    try {
      const r = await withRetry(() =>
        getClient().models.generateContent({
          model: this.model(tier),
          contents: [
            {
              role: "user",
              parts: [...(images ?? []).map((i) => ({ inlineData: { mimeType: i.mimeType, data: i.data.toString("base64") } })), { text: user }],
            },
          ],
          config: {
            systemInstruction: system,
            responseMimeType: "application/json",
            responseJsonSchema: jsonSchema(schema),
            maxOutputTokens: 32000,
          },
        }),
      );
      checkFinish(r);
      let parsed: unknown;
      try {
        parsed = JSON.parse(r.text ?? "");
      } catch {
        throw new LlmError("The language model returned output that was not valid JSON.");
      }
      const result = schema.safeParse(parsed);
      if (!result.success) throw new LlmError("The language model returned output that failed validation.");
      return result.data;
    } catch (err) {
      wrap(err);
    }
  },

  async text({ system, user, tier }) {
    try {
      const r = await withRetry(() =>
        getClient().models.generateContent({
          model: this.model(tier),
          contents: [{ role: "user", parts: [{ text: user }] }],
          config: { systemInstruction: system, maxOutputTokens: 4000 },
        }),
      );
      checkFinish(r);
      return r.text ?? "";
    } catch (err) {
      wrap(err);
    }
  },

  async stream({ system, history, user, tier, onText }) {
    try {
      // Retry only opening the stream; a failure mid-reply surfaces to the user.
      const stream = await withRetry(() => getClient().models.generateContentStream({
        model: this.model(tier),
        contents: [
          ...history.map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] })),
          { role: "user", parts: [{ text: user }] },
        ],
        config: { systemInstruction: system, maxOutputTokens: 16000 },
      }));
      let full = "";
      let last: GenerateContentResponse | undefined;
      for await (const chunk of stream) {
        last = chunk;
        const t = chunk.text;
        if (t) {
          full += t;
          onText(t);
        }
      }
      if (last) checkFinish(last);
      return full;
    } catch (err) {
      wrap(err);
    }
  },
};
