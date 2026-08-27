export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatCompletionInput = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type ChatCompletionResult = {
  id?: string;
  model: string;
  choices: Array<{
    index?: number;
    message?: { role: string; content: string };
    finish_reason?: string;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

export type ProviderFailureCode =
  | "NOT_CONFIGURED"
  | "MODEL_NOT_FOUND"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "NETWORK_ERROR";

export class ProviderError extends Error {
  constructor(
    public readonly code: ProviderFailureCode,
    public readonly providerId: string,
    public readonly status: number,
  ) {
    super(code);
  }
}

export type ProviderHealth = "configured" | "not_configured";

export interface ProviderAdapter {
  readonly id: string;
  readonly displayName: string;
  isConfigured(): boolean;
  healthCheck(): Promise<ProviderHealth>;
  supports(capability: "chat"): boolean;
  chatCompletion(input: ChatCompletionInput): Promise<ChatCompletionResult>;
}
