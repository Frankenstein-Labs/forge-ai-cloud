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
import { callHuggingFace } from "@/lib/hf-gateway";

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

const LOVABLE_MODELS = new Set([
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-3-flash-preview",
  "google/gemini-3.1-pro-preview",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
]);

const DEFAULT_MODEL = "google/gemini-2.5-flash";

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

        const requestedModel = (body.model ?? DEFAULT_MODEL).trim();
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

        // 4) Routing : HuggingFace ou Lovable AI Gateway
        const isHF = requestedModel.startsWith("hf/");
        let resultModel = requestedModel;
        let result: {
          id?: string;
          choices?: Array<{
            index?: number;
            message?: { role: string; content: string };
            finish_reason?: string;
          }>;
          usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
          };
        };

        if (isHF) {
          // ── Route HuggingFace ────────────────────────────────────────
          const repo = requestedModel.slice(3); // "hf/owner/name" -> "owner/name"
          if (!repo.includes("/")) {
            return apiError(
              request,
              400,
              "INVALID_MODEL",
              "Format de modèle Hugging Face invalide.",
            );
          }
          const hf = await callHuggingFace(repo, {
            model: repo,
            messages,
            temperature: body.temperature,
            max_tokens: body.max_tokens,
          });
          if (!hf.ok) {
            const status = hf.status === 401 ? 502 : hf.status; // évite 401 vers le client
            return apiError(
              request,
              status >= 400 && status < 600 ? status : 502,
              "PROVIDER_UNAVAILABLE",
              "Le provider Hugging Face n'a pas pu traiter cette requête.",
            );
          }
          result = hf.data;
          resultModel = `hf/${repo}`;
        } else {
          // ── Route Lovable AI Gateway ─────────────────────────────────
          const model = LOVABLE_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL;
          const lovableKey = process.env.LOVABLE_API_KEY;
          if (!lovableKey) {
            return apiError(
              request,
              503,
              "PROVIDER_NOT_CONFIGURED",
              "Le provider demandé n'est pas configuré.",
            );
          }

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages,
              ...(typeof body.temperature === "number" ? { temperature: body.temperature } : {}),
              ...(typeof body.max_tokens === "number" ? { max_tokens: body.max_tokens } : {}),
            }),
          });

          if (upstream.status === 429) {
            return apiError(
              request,
              429,
              "PROVIDER_RATE_LIMITED",
              "Le provider a limité cette requête.",
            );
          }
          if (upstream.status === 402) {
            return apiError(
              request,
              503,
              "PROVIDER_UNAVAILABLE",
              "Le provider ne peut pas traiter cette requête.",
            );
          }
          if (!upstream.ok) {
            await upstream.text();
            return apiError(request, 502, "PROVIDER_ERROR", "Le provider a renvoyé une erreur.");
          }
          result = (await upstream.json()) as typeof result;
          resultModel = model;
        }

        const tokensIn = result.usage?.prompt_tokens ?? 0;
        const tokensOut = result.usage?.completion_tokens ?? 0;
        const totalTokens = result.usage?.total_tokens ?? tokensIn + tokensOut;

        // 5) Log usage + décompte (best-effort, n'échoue pas la requête)
        try {
          await supabase.from("usage_events").insert({
            user_id: authed.user_id,
            api_key_id: authed.api_key_id,
            model_name: resultModel,
            tokens_input: tokensIn,
            tokens_output: tokensOut,
            cost_eur: 0,
          });
          if (totalTokens > 0 && profile) {
            await supabase
              .from("profiles")
              .update({
                credits_balance: Math.max(0, profile.credits_balance - totalTokens),
              })
              .eq("id", authed.user_id);
          }
        } catch (e) {
          console.error("usage logging failed:", e);
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
