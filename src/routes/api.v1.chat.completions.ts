// Endpoint OpenAI-compatible : POST /api/v1/chat/completions
// Auth via clé API Aetheris (Bearer sk-aeth-... ou X-API-Key).
// Forward vers Lovable AI Gateway, décompte les crédits, log dans usage_events.
import { createFileRoute } from "@tanstack/react-router";
import {
  authenticateApiKey,
  corsHeaders,
  getServerSupabase,
  jsonResponse,
  unauthorizedResponse,
} from "@/lib/api-auth";

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

const ALLOWED_MODELS = new Set([
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
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),

      POST: async ({ request }) => {
        // 1) Auth par clé API
        const authed = await authenticateApiKey(request);
        if (!authed) return unauthorizedResponse();

        // 2) Parse + validation
        let body: ChatRequest;
        try {
          body = (await request.json()) as ChatRequest;
        } catch {
          return jsonResponse({ error: "JSON invalide" }, 400);
        }

        const model =
          body.model && ALLOWED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) {
          return jsonResponse(
            { error: "'messages' requis (format OpenAI chat.completions)" },
            400,
          );
        }

        // 3) Vérifier les crédits utilisateur
        const supabase = getServerSupabase();
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits_balance")
          .eq("id", authed.user_id)
          .maybeSingle();

        if (profile && profile.credits_balance <= 0) {
          return jsonResponse(
            { error: "Crédits épuisés. Recharge ton compte sur /dashboard/billing." },
            402,
          );
        }

        // 4) Forward vers Lovable AI Gateway
        const lovableKey = process.env.LOVABLE_API_KEY;
        if (!lovableKey) {
          return jsonResponse(
            { error: "Backend mal configuré (LOVABLE_API_KEY manquante)." },
            500,
          );
        }

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages,
              ...(typeof body.temperature === "number"
                ? { temperature: body.temperature }
                : {}),
              ...(typeof body.max_tokens === "number"
                ? { max_tokens: body.max_tokens }
                : {}),
            }),
          },
        );

        if (upstream.status === 429) {
          return jsonResponse(
            { error: "Rate limit dépassé sur le gateway IA." },
            429,
          );
        }
        if (upstream.status === 402) {
          return jsonResponse(
            { error: "Crédits Lovable AI épuisés côté workspace." },
            402,
          );
        }
        if (!upstream.ok) {
          const txt = await upstream.text();
          return jsonResponse(
            { error: `Erreur gateway (${upstream.status})`, details: txt.slice(0, 500) },
            502,
          );
        }

        const result = (await upstream.json()) as {
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

        const tokensIn = result.usage?.prompt_tokens ?? 0;
        const tokensOut = result.usage?.completion_tokens ?? 0;
        const totalTokens = result.usage?.total_tokens ?? tokensIn + tokensOut;

        // 5) Log usage + décompte (best-effort, n'échoue pas la requête)
        try {
          await supabase.from("usage_events").insert({
            user_id: authed.user_id,
            api_key_id: authed.api_key_id,
            model_name: model,
            tokens_input: tokensIn,
            tokens_output: tokensOut,
            cost_eur: 0,
          });
          if (totalTokens > 0 && profile) {
            await supabase
              .from("profiles")
              .update({
                credits_balance: Math.max(
                  0,
                  profile.credits_balance - totalTokens,
                ),
              })
              .eq("id", authed.user_id);
          }
        } catch (e) {
          console.error("usage logging failed:", e);
        }

        // 6) Réponse au format OpenAI
        return jsonResponse({
          id: result.id ?? `aetheris-${crypto.randomUUID()}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model,
          choices: result.choices ?? [],
          usage: {
            prompt_tokens: tokensIn,
            completion_tokens: tokensOut,
            total_tokens: totalTokens,
          },
        });
      },
    },
  },
});
