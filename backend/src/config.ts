const env = process.env;

const geminiKey = env.GEMINI_API_KEY?.trim() || env.GOOGLE_API_KEY?.trim() || undefined;
const voyageKey = env.VOYAGE_API_KEY?.trim() || undefined;
const anthropicConfigured = Boolean(
  env.ANTHROPIC_API_KEY?.trim() || env.ANTHROPIC_AUTH_TOKEN?.trim() || env.ANTHROPIC_PROFILE?.trim(),
);

// Providers: explicit setting wins, otherwise use whichever key is present.
const embeddingProvider = (env.EMBEDDING_PROVIDER?.trim() || (voyageKey ? "voyage" : geminiKey ? "gemini" : "none")) as
  | "voyage"
  | "gemini"
  | "none";
const llmProvider = (env.LLM_PROVIDER?.trim() || (anthropicConfigured ? "anthropic" : geminiKey ? "gemini" : "none")) as
  | "anthropic"
  | "gemini"
  | "none";

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value !== "" ? parsed : fallback;
}

export const config = {
  port: num(env.PORT, 8787),
  corsOrigins: (env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  mongo: {
    uri: env.MONGODB_URI?.trim() || undefined,
    db: env.MONGODB_DB || "fixskrew",
    collection: env.MONGODB_COLLECTION || "chunks",
    vectorIndex: env.MONGODB_VECTOR_INDEX || "chunks_vector_index",
  },

  gemini: { apiKey: geminiKey },

  embeddings: {
    provider: embeddingProvider,
    apiKey: embeddingProvider === "voyage" ? voyageKey : embeddingProvider === "gemini" ? geminiKey : undefined,
    model: env.EMBEDDING_MODEL || (embeddingProvider === "gemini" ? "gemini-embedding-2" : "voyage-3.5"),
    dimensions: num(env.EMBEDDING_DIMENSIONS, 1024),
    multilingual: (env.EMBEDDING_MULTILINGUAL ?? "true").toLowerCase() !== "false",
  },

  llm: {
    provider: llmProvider,
    configured: llmProvider === "anthropic" ? anthropicConfigured : llmProvider === "gemini" ? Boolean(geminiKey) : false,
    /** Model for investigation reports. */
    model: env.LLM_MODEL || (llmProvider === "gemini" ? "gemini-flash-latest" : "claude-opus-5-5"),
    /** Model for chat replies, document extraction and translation. */
    fastModel: env.LLM_FAST_MODEL || (llmProvider === "gemini" ? "gemini-flash-lite-latest" : env.LLM_MODEL || "claude-opus-5-5"),
    effort: (env.LLM_EFFORT || "high") as "low" | "medium" | "high" | "xhigh" | "max",
  },

  retrieval: {
    limit: num(env.RETRIEVAL_LIMIT, 10),
    // Atlas reports cosine as (1 + cos) / 2. Calibrated per embedding model: with
    // gemini-embedding-2, relevant passages score ~0.88+, off-topic automotive text ~0.82.
    minScore: num(env.RETRIEVAL_MIN_SCORE, embeddingProvider === "gemini" ? 0.85 : 0.78),
  },
};
