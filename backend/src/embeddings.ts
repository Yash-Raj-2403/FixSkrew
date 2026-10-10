import { ApiError, GoogleGenAI } from "@google/genai";
import { config } from "./config.js";
import { ServiceNotConfiguredError } from "./db.js";

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

/**
 * Embed texts with the configured Voyage AI model.
 * `inputType` lets Voyage apply its query/document prompts, which improves retrieval.
 */
export async function embed(texts: string[], inputType: "query" | "document"): Promise<number[][]> {
  if (!config.embeddings.apiKey) throw new ServiceNotConfiguredError("Embedding model (GEMINI_API_KEY or VOYAGE_API_KEY)");
  return config.embeddings.provider === "gemini" ? embedGemini(texts, inputType) : embedVoyage(texts, inputType);
}

let gemini: GoogleGenAI | null = null;

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof ApiError) || ![429, 500, 502, 503, 504].includes(err.status) || i >= attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 800 * 2 ** i + Math.random() * 400));
    }
  }
}

/** gemini-embedding-2: multilingual, task-typed retrieval embeddings. */
async function embedGemini(texts: string[], inputType: "query" | "document"): Promise<number[][]> {
  gemini ??= new GoogleGenAI({ apiKey: config.embeddings.apiKey });
  const out: number[][] = [];
  const batchSize = 100;
  for (let i = 0; i < texts.length; i += batchSize) {
    const client = gemini;
    const res = await withRetry(() => client.models.embedContent({
      model: config.embeddings.model,
      // One Content per text: a plain string array is merged into a single multimodal embedding.
      contents: texts.slice(i, i + batchSize).map((text) => ({ parts: [{ text }] })),
      config: {
        taskType: inputType === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
        outputDimensionality: config.embeddings.dimensions,
      },
    }));
    for (const e of res.embeddings ?? []) {
      if (!e.values) throw new Error("Embedding response was missing values.");
      out.push(normalize(e.values));
    }
  }
  if (out.length !== texts.length) throw new Error(`Expected ${texts.length} embeddings, received ${out.length}.`);
  return out;
}

/** Reduced-dimension Gemini embeddings are not unit length; normalise for cosine search. */
function normalize(v: number[]): number[] {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
}

async function embedVoyage(texts: string[], inputType: "query" | "document"): Promise<number[][]> {
  const out: number[][] = [];
  const batchSize = 64;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const res = await fetch(VOYAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.embeddings.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: batch,
        model: config.embeddings.model,
        input_type: inputType,
        output_dimension: config.embeddings.dimensions,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Embedding request failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    const json = (await res.json()) as { data: { embedding: number[]; index: number }[] };
    json.data.sort((a, b) => a.index - b.index).forEach((d) => out.push(d.embedding));
  }
  return out;
}

export function embeddingsConfigured(): boolean {
  return Boolean(config.embeddings.apiKey);
}
