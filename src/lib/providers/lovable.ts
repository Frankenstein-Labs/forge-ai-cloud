import { configured } from "@/lib/server-config";
import {
  type ChatCompletionInput,
  type ChatCompletionResult,
  ProviderAdapter,
  ProviderError,
  type ProviderHealth,
} from "@/lib/providers/types";

const SUPPORTED_MODELS = new Set([
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-3-flash-preview",
  "google/gemini-3.1-pro-preview",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
]);

export class LovableProvider implements ProviderAdapter {
  readonly id = "lovable";
  readonly displayName = "Lovable AI Gateway (transition)";

  isConfigured() {
    return configured("LOVABLE_API_KEY");
  }

  async healthCheck(): Promise<ProviderHealth> {
    return this.isConfigured() ? "configured" : "not_configured";
  }

  supports(capability: "chat") {
    return capability === "chat";
  }

  async chatCompletion(input: ChatCompletionInput): Promise<ChatCompletionResult> {
    if (!this.isConfigured()) throw new ProviderError("NOT_CONFIGURED", this.id, 503);
    if (!SUPPORTED_MODELS.has(input.model))
      throw new ProviderError("MODEL_NOT_FOUND", this.id, 404);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new ProviderError("NOT_CONFIGURED", this.id, 503);

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          model: input.model,
          messages: input.messages,
          ...(typeof input.temperature === "number" ? { temperature: input.temperature } : {}),
          ...(typeof input.maxTokens === "number" ? { max_tokens: input.maxTokens } : {}),
        }),
      });
    } catch {
      throw new ProviderError("NETWORK_ERROR", this.id, 502);
    }
    if (!response.ok) {
      await response.text();
      throw new ProviderError(
        response.status === 429 ? "RATE_LIMITED" : "UPSTREAM_ERROR",
        this.id,
        response.status,
      );
    }
    const result = (await response.json()) as Omit<ChatCompletionResult, "model">;
    return { ...result, model: input.model, choices: result.choices ?? [] };
  }
}

export function isLovableModel(model: string) {
  return SUPPORTED_MODELS.has(model);
}
