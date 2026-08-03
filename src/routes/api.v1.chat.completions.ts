// Endpoint OpenAI-compatible : POST /api/v1/chat/completions
// Auth via clé API Aetheris (Bearer sk-aeth-... ou X-API-Key).
// Routing : 'hf/<owner>/<repo>'  -> HuggingFace Inference API
//            sinon                -> Lovable AI Gateway (Gemini, GPT-5)
import { createFileRoute } from "@tanstack/react-router";
import {
  authenticateApiKey,
  corsHeaders,
  getServerSupabase,
  jsonResponse,
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
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

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

        const requestedModel = (body.model ?? DEFAULT_MODEL).trim();
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) {
          return jsonResponse({ error: "'messages' requis (format OpenAI chat.completions)" }, 400);
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
            return jsonResponse(
              {
                error:
                  "Format attendu : 'hf/<owner>/<repo>' (ex: hf/mistralai/Mistral-7B-Instruct-v0.3)",
              },
              400,
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
            return jsonResponse(
              { error: `HuggingFace error (${hf.status})`, details: hf.message },
              status >= 400 && status < 600 ? status : 502,
            );
          }
          result = hf.data;
          resultModel = `hf/${repo}`;
        } else {
          // ── Route Lovable AI Gateway ─────────────────────────────────
          const model = LOVABLE_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL;
          const lovableKey = process.env.LOVABLE_API_KEY;
          if (!lovableKey) {
            return jsonResponse(
              { error: "Backend mal configuré (LOVABLE_API_KEY manquante)." },
              500,
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
            return jsonResponse({ error: "Rate limit dépassé sur le gateway IA." }, 429);
          }
          if (upstream.status === 402) {
            return jsonResponse({ error: "Crédits Lovable AI épuisés côté workspace." }, 402);
          }
          if (!upstream.ok) {
            const txt = await upstream.text();
            return jsonResponse(
              { error: `Erreur gateway (${upstream.status})`, details: txt.slice(0, 500) },
              502,
            );
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
        return jsonResponse({
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
        });
      },
    },
  },
});
