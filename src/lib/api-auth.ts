// Middleware partagé pour valider une clé API Aetheris (sk-aeth-...)
// Utilisable depuis n'importe quelle route serveur (/api/*).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-API-Key, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400",
};

export function getServerSupabase(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing on server");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function extractApiKey(request: Request): string | null {
  const xKey = request.headers.get("x-api-key");
  if (xKey) return xKey.trim();
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return null;
}

export interface AuthedKey {
  user_id: string;
  api_key_id: string;
  permissions: "read_only" | "read_write" | "admin";
  budget_limit_tokens: number | null;
}

/**
 * Valide la clé API contre Supabase (RPC validate_api_key).
 * Retourne null si absente/invalide/expirée/révoquée.
 */
export async function authenticateApiKey(request: Request): Promise<AuthedKey | null> {
  const key = extractApiKey(request);
  if (!key) return null;
  const hashed = await sha256Hex(key);
  const supabase = getServerSupabase();
  const { data, error } = await supabase.rpc("validate_api_key", {
    _hashed_key: hashed,
  });
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return {
    user_id: row.user_id,
    api_key_id: row.api_key_id,
    permissions: row.permissions,
    budget_limit_tokens: row.budget_limit_tokens,
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function unauthorizedResponse(
  message = "Clé API invalide ou manquante. Header attendu : 'Authorization: Bearer sk-aeth-...' ou 'X-API-Key: sk-aeth-...'",
): Response {
  return jsonResponse({ error: message }, 401);
}
