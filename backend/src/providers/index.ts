import { config } from "../config.js";
import { ServiceNotConfiguredError } from "../db.js";
import { anthropicProvider } from "./anthropic.js";
import { geminiProvider } from "./gemini.js";
import type { LlmProvider } from "./types.js";

export * from "./types.js";

export function llm(): LlmProvider {
  if (config.llm.provider === "anthropic") return anthropicProvider;
  if (config.llm.provider === "gemini") return geminiProvider;
  throw new ServiceNotConfiguredError("Language model (GEMINI_API_KEY or ANTHROPIC_API_KEY)");
}
