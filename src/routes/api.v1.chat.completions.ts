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
  requestId,
  unauthorizedResponse,
} from "@/lib/api-auth";
import { DEFAULT_CHAT_MODEL, resolveChatProvider } from "@/lib/providers/registry";
import { getHfTokenForUser } from "@/lib/hf-token.server";
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

const DEFAULT_MAX_TOKENS = 1024;
const MAX_COMPLETION_TOKENS = 8192;

function reserveTokens(messages: ChatMessage[], maxTokens: number): number {
  const inputCharacters = messages.reduce((total, message) => total + message.content.length, 0);
  // Conservative pre-call reservation only; provider-reported usage settles the final amount.
  return maxTokens + inputCharacters * 4 + 128;
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

        const maxTokens = body.max_tokens ?? DEFAULT_MAX_TOKENS;
        if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > MAX_COMPLETION_TOKENS) {
          return apiError(
            request,
            400,
            "INVALID_MAX_TOKENS",
            "max_tokens doit être compris entre 1 et 8192.",
          );
        }

        // 3) Resolve the provider before charging a reservation.
        const supabase = getServerSupabase();
        const resolved = resolveChatProvider(requestedModel);
        if (!resolved)
          return apiError(request, 404, "MODEL_NOT_FOUND", "Modèle non pris en charge.");
        if (!authed.organization_id) {
          return apiError(
            request,
            409,
            "ORGANIZATION_REQUIRED",
            "Cette clé doit être liée à une organisation.",
          );
        }

        const requestedReservation = reserveTokens(messages, maxTokens);
        const reservationResponse = (await supabase.rpc(
          "reserve_usage_tokens" as never,
          {
            _organization_id: authed.organization_id,
            _user_id: authed.user_id,
            _api_key_id: authed.api_key_id,
            _request_id: requestId(request),
            _reserved_tokens: requestedReservation,
            _expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
          } as never,
        )) as unknown as { data: string | null; error: { message: string } | null };
        if (reservationResponse.error || !reservationResponse.data) {
          const insufficient = reservationResponse.error?.message.includes("INSUFFICIENT_CREDITS");
          return apiError(
            request,
            insufficient ? 402 : 503,
            insufficient ? "CREDITS_EXHAUSTED" : "USAGE_ACCOUNTING_UNAVAILABLE",
            insufficient ? "Crédits insuffisants." : "La comptabilité d'usage est indisponible.",
          );
        }
        const reservationId = reservationResponse.data;

        let result;
        try {
          const hfToken =
            resolved.provider.id === "huggingface"
              ? await getHfTokenForUser(authed.user_id)
              : undefined;
          result = await resolved.provider.chatCompletion({
            model: resolved.upstreamModel,
            messages,
            temperature: body.temperature,
            maxTokens,
            hfToken,
          });
        } catch (error) {
          await supabase.rpc(
            "release_usage_reservation" as never,
            {
              _reservation_id: reservationId,
              _reason: "provider failure",
            } as never,
          );
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

        const settlement = (await supabase.rpc(
          "settle_usage_reservation" as never,
          { _reservation_id: reservationId, _actual_tokens: totalTokens } as never,
        )) as unknown as { error: { message: string } | null };
        if (settlement.error) {
          return apiError(
            request,
            503,
            "USAGE_ACCOUNTING_UNAVAILABLE",
            "La comptabilité d'usage est indisponible.",
          );
        }

        // 5) Log provider-reported usage. Ledger settlement is completed before this best-effort view.
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
