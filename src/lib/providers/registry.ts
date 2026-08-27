import { HuggingFaceProvider } from "@/lib/providers/huggingface";
import { isLovableModel, LovableProvider } from "@/lib/providers/lovable";
import type { ProviderAdapter } from "@/lib/providers/types";

const providers: ProviderAdapter[] = [new HuggingFaceProvider(), new LovableProvider()];

export const DEFAULT_CHAT_MODEL = "google/gemini-2.5-flash";

export function resolveChatProvider(
  model: string,
): { provider: ProviderAdapter; upstreamModel: string } | null {
  if (model.startsWith("hf/")) {
    const upstreamModel = model.slice(3);
    if (!upstreamModel.includes("/")) return null;
    return { provider: providers[0], upstreamModel };
  }
  if (isLovableModel(model)) return { provider: providers[1], upstreamModel: model };
  return null;
}

export async function providerStatuses() {
  return Promise.all(
    providers.map(async (provider) => ({
      id: provider.id,
      name: provider.displayName,
      status: await provider.healthCheck(),
    })),
  );
}
