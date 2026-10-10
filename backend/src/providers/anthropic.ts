import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { config } from "../config.js";
import { LlmError, LlmUnavailableError, type LlmProvider } from "./types.js";

// Server-side fallback: if the primary model declines, the API re-runs the request on
// Anthropic's recommended fallback model inside the same call.
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

function wrap(err: unknown): never {
  if (err instanceof LlmError) throw err;
  if (err instanceof Anthropic.RateLimitError) throw new LlmUnavailableError("The language model is rate limited. Try again shortly.", true);
  if (err instanceof Anthropic.APIError) {
    console.error("[anthropic]", err.status, err.message);
    throw new LlmUnavailableError("The language model request failed. Check the diagnostic service logs.", false);
  }
  throw err;
}

export const anthropicProvider: LlmProvider = {
  name: "anthropic",
  model: (tier) => (tier === "fast" ? config.llm.fastModel : config.llm.model),

  async structured({ system, user, schema, effort, tier, images }) {
    try {
      const response = await getClient().beta.messages.parse({
        model: this.model(tier),
        max_tokens: 16000,
        betas: [FALLBACK_BETA],
        fallbacks: "default",
        thinking: { type: "adaptive" },
        output_config: { effort, format: betaZodOutputFormat(schema) },
        system,
        messages: [
          {
            role: "user",
            content: images?.length
              ? [
                  ...images.map((i) => ({
                    type: "image" as const,
                    source: { type: "base64" as const, media_type: i.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: i.data.toString("base64") },
                  })),
                  { type: "text" as const, text: user },
                ]
              : user,
          },
        ],
      });
      if (response.stop_reason === "refusal") throw new LlmError("The language model declined this request.");
      if (response.stop_reason === "max_tokens") throw new LlmError("The output was cut off before completion.");
      if (!response.parsed_output) throw new LlmError("The language model returned output that failed validation.");
      return response.parsed_output;
    } catch (err) {
      wrap(err);
    }
  },

  async text({ system, user, effort, tier }) {
    try {
      const response = await getClient().messages.create({
        model: this.model(tier),
        max_tokens: 4000,
        output_config: { effort },
        system,
        messages: [{ role: "user", content: user }],
      });
      if (response.stop_reason === "refusal") throw new LlmError("The language model declined this request.");
      return response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    } catch (err) {
      wrap(err);
    }
  },

  async stream({ system, history, user, effort, tier, onText }) {
    try {
      const stream = getClient().beta.messages.stream({
        model: this.model(tier),
        max_tokens: 16000,
        betas: [FALLBACK_BETA],
        fallbacks: "default",
        output_config: { effort },
        system,
        messages: [...history, { role: "user", content: user }],
      });
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") onText(event.delta.text);
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === "refusal") throw new LlmError("The language model declined to answer this message.");
      return final.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    } catch (err) {
      wrap(err);
    }
  },
};
