import { callHuggingFace } from "@/lib/hf-gateway";
import { configured } from "@/lib/server-config";
import {
  type ChatCompletionInput,
  type ChatCompletionResult,
  ProviderAdapter,
  ProviderError,
  type ProviderHealth,
} from "@/lib/providers/types";

export class HuggingFaceProvider implements ProviderAdapter {
  readonly id = "huggingface";
  readonly displayName = "Hugging Face Inference Providers";

  isConfigured() {
    return configured("HF_TOKEN");
  }

  /** La clé de l'utilisateur suffit même si le serveur n'en a pas. */
  isUsable(userToken?: string) {
    return Boolean(userToken?.trim()) || this.isConfigured();
  }

  async healthCheck(): Promise<ProviderHealth> {
    return this.isConfigured() ? "configured" : "not_configured";
  }

  supports(capability: "chat") {
    return capability === "chat";
  }

  async chatCompletion(input: ChatCompletionInput): Promise<ChatCompletionResult> {
    if (!this.isUsable(input.hfToken)) throw new ProviderError("NOT_CONFIGURED", this.id, 503);
    const result = await callHuggingFace(
      input.model,
      {
      model: input.model,
      messages: input.messages,
      temperature: input.temperature,
        max_tokens: input.maxTokens,
      },
      input.hfToken,
    );
    if (result.ok)
      return { ...result.data, model: `hf/${input.model}`, choices: result.data.choices ?? [] };

    const code =
      result.status === 429
        ? "RATE_LIMITED"
        : result.status === 404
          ? "MODEL_NOT_FOUND"
          : "UPSTREAM_ERROR";
    throw new ProviderError(
      code,
      this.id,
      result.status >= 400 && result.status < 600 ? result.status : 502,
    );
  }
}
