// Endpoint OpenAI-compatible : POST /api/v1/chat/completions
// Auth via clé API Aetheris (Bearer sk-aeth-... ou X-API-Key).
// Routing : 'hf/<owner>/<repo>'  -> HuggingFace Inference API
//            sinon                -> Lovable AI Gateway (Gemini, GPT-5)
import { createFileRoute } from "@tanstack/react-router";
import {
  authenticateApiKey,
  apiError,
  corsHeadersFor,
  getServerSupabase,
  jsonResponse,
  readJsonBody,
  RequestBodyTooLargeError,
  requireApiPermission,
  requireApiScope,
  unauthorizedResponse,
} from "@/lib/api-auth";
import { DEFAULT_CHAT_MODEL, resolveChatProvider } from "@/lib/providers/registry";
import { ProviderError } from "@/lib/providers/types";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  model?: string;
  messages?: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export const Route = createFileRoute("/api/v1/chat/completions")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        new Response(null, { status: 204, headers: corsHeadersFor(request) }),

      POST: async ({ request }) => {
        // 1) Auth par clé API
        const authed = await authenticateApiKey(request);
        if (!authed) return unauthorizedResponse(undefined, request);
        if (
          !requireApiPermission(authed, "read_write") ||
          !requireApiScope(authed, "inference:chat")
        ) {
          return apiError(
            request,
            403,
            "INSUFFICIENT_SCOPE",
            "Cette clé ne peut pas exécuter une inférence.",
          );
        }

        // 2) Parse + validation
        let body: ChatRequest;
        try {
          body = await readJsonBody<ChatRequest>(request);
        } catch (error) {
          if (error instanceof RequestBodyTooLargeError) {
            return apiError(
              request,
              413,
              "REQUEST_TOO_LARGE",
              "Le corps de la requête est trop volumineux.",
            );
          }
          return apiError(request, 400, "INVALID_JSON", "Corps JSON invalide.");
        }

        const requestedModel = (body.model ?? DEFAULT_CHAT_MODEL).trim();
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) {
          return apiError(request, 400, "INVALID_REQUEST", "'messages' est requis.");
        }

        // 3) Vérifier les crédits utilisateur
        const supabase = getServerSupabase();
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits_balance")
          .eq("id", authed.user_id)
          .maybeSingle();

        if (profile && profile.credits_balance <= 0) {
          return apiError(request, 402, "CREDITS_EXHAUSTED", "Crédits épuisés.");
        }

        // 4) Provider registry: a missing credential is NOT CONFIGURED, never connected.
        const resolved = resolveChatProvider(requestedModel);
        if (!resolved)
          return apiError(request, 404, "MODEL_NOT_FOUND", "Modèle non pris en charge.");

        let result;
        try {
          result = await resolved.provider.chatCompletion({
            model: resolved.upstreamModel,
            messages,
            temperature: body.temperature,
            maxTokens: body.max_tokens,
          });
        } catch (error) {
          if (!(error instanceof ProviderError)) {
            return apiError(request, 502, "PROVIDER_ERROR", "Le provider a renvoyé une erreur.");
          }
          const status = error.code === "RATE_LIMITED" ? 429 : error.status;
          const code =
            error.code === "NOT_CONFIGURED" ? "PROVIDER_NOT_CONFIGURED" : `PROVIDER_${error.code}`;
          return apiError(request, status, code, "Le provider ne peut pas traiter cette requête.");
        }

        const resultModel = result.model;

        const tokensIn = result.usage?.prompt_tokens ?? 0;
        const tokensOut = result.usage?.completion_tokens ?? 0;
        const totalTokens = result.usage?.total_tokens ?? tokensIn + tokensOut;

        // 5) Log usage + décompte (best-effort, n'échoue pas la requête)
        try {
          await supabase.from("usage_events" as never).insert({
            user_id: authed.user_id,
            api_key_id: authed.api_key_id,
            organization_id: authed.organization_id,
            model_name: resultModel,
            tokens_input: tokensIn,
            tokens_output: tokensOut,
            cost_eur: 0,
          } as never);
          if (totalTokens > 0 && profile) {
            await supabase
              .from("profiles")
              .update({
                credits_balance: Math.max(0, profile.credits_balance - totalTokens),
              })
              .eq("id", authed.user_id);
          }
        } catch {
          console.error("usage logging failed");
        }

        // 6) Réponse au format OpenAI
        return jsonResponse(
          {
            id: result.id ?? `aetheris-${crypto.randomUUID()}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: resultModel,
            choices: result.choices ?? [],
            usage: {
              prompt_tokens: tokensIn,
              completion_tokens: tokensOut,
              total_tokens: totalTokens,
            },
          },
          200,
          request,
        );
      },
    },
  },
});
