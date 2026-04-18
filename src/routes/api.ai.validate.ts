// Endpoint de test pour le middleware X-API-Key.
// Vérifie la clé envoyée dans le header X-API-Key (ou Authorization: Bearer ...)
// puis renvoie l'identité du propriétaire (user_id, permissions, budget).
// Utilisez ce même pattern dans toutes les routes /api/ai/*.
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "X-API-Key, Authorization, Content-Type",
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function extractApiKey(request: Request): string | null {
  const xKey = request.headers.get("x-api-key");
  if (xKey) return xKey.trim();
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return null;
}

/**
 * Réutilise cette fonction dans toutes tes routes IA.
 * Retourne null si invalide → renvoie 401.
 */
export async function authenticateApiKey(request: Request) {
  const key = extractApiKey(request);
  if (!key) return null;
  const hashed = await sha256Hex(key);
  const { data, error } = await supabaseAdmin.rpc("validate_api_key", {
    _hashed_key: hashed,
  });
  if (error || !data || data.length === 0) return null;
  return data[0]; // { user_id, api_key_id, permissions, budget_limit_tokens }
}

export const Route = createFileRoute("/api/ai/validate")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      GET: async ({ request }) => {
        const auth = await authenticateApiKey(request);
        if (!auth) {
          return new Response(
            JSON.stringify({ error: "Clé API invalide ou manquante" }),
            {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        return new Response(
          JSON.stringify({
            ok: true,
            user_id: auth.user_id,
            permissions: auth.permissions,
            budget_limit_tokens: auth.budget_limit_tokens,
            message: "Clé valide. Tu peux appeler les routes /api/ai/*.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      },
    },
  },
});
