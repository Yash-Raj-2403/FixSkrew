import type { z } from "zod/v4";

export type Effort = "low" | "medium" | "high";

/** "report" uses the main model; "fast" is for chat, extraction and translation. */
export type ModelTier = "report" | "fast";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface LlmImage {
  mimeType: string;
  data: Buffer;
}

/** Minimal surface FixSkrew needs from a language model. */
export interface LlmProvider {
  readonly name: "anthropic" | "gemini";
  model(tier: ModelTier): string;
  /** JSON output validated against `schema`. Throws LlmError on refusal or invalid output. */
  structured<T>(opts: { system: string; user: string; schema: z.ZodType<T>; effort: Effort; tier: ModelTier; images?: LlmImage[] }): Promise<T>;
  text(opts: { system: string; user: string; effort: Effort; tier: ModelTier }): Promise<string>;
  stream(opts: { system: string; history: ChatTurn[]; user: string; effort: Effort; tier: ModelTier; onText: (t: string) => void }): Promise<string>;
}

/** The model declined, was cut off, or returned output that failed validation. */
export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmError";
  }
}

/** The provider API itself failed (auth, quota, network, 5xx). */
export class LlmUnavailableError extends Error {
  constructor(
    message: string,
    public readonly rateLimited: boolean,
  ) {
    super(message);
    this.name = "LlmUnavailableError";
  }
}
