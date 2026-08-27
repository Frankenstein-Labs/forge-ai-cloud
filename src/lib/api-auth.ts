// Middleware partagé pour valider une clé API Aetheris (sk-aeth-...)
// Utilisable depuis n'importe quelle route serveur (/api/*).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { allowedOrigins } from "@/lib/server-config";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-API-Key, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400",
};

const requestIds = new WeakMap<Request, string>();

/** Returns CORS headers only for explicitly allowed origins; never reflects arbitrary origins. */
export function corsHeadersFor(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins().includes(origin)) return corsHeaders;
  return { ...corsHeaders, "Access-Control-Allow-Origin": origin, Vary: "Origin" };
}

export function requestId(request: Request): string {
  // Request IDs are generated server-side. Client supplied values are not safe idempotency keys.
  const existing = requestIds.get(request);
  if (existing) return existing;
  const id = crypto.randomUUID();
  requestIds.set(request, id);
  return id;
}

export function apiError(
  request: Request,
  status: number,
  code: string,
  message: string,
): Response {
  const id = requestId(request);
  return new Response(JSON.stringify({ error: { code, message, request_id: id } }), {
    status,
    headers: {
      ...corsHeadersFor(request),
      "Content-Type": "application/json",
      "X-Request-ID": id,
    },
  });
}

export async function readJsonBody<T>(request: Request, maxBytes = 1_000_000): Promise<T> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new RequestBodyTooLargeError();
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new RequestBodyTooLargeError();
  return JSON.parse(text) as T;
}

export class RequestBodyTooLargeError extends Error {}

export function getServerSupabase(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error("Missing required server configuration: SUPABASE_URL and Supabase key");
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
  organization_id: string | null;
  permissions: "read_only" | "read_write" | "admin";
  scopes: string[];
  environment: "test" | "live";
  budget_limit_tokens: number | null;
  budget_limit_eur: number | null;
  rate_limit_per_minute: number;
}

export function requireApiPermission(
  auth: AuthedKey,
  minimum: "read_only" | "read_write" | "admin",
): boolean {
  const rank = { read_only: 1, read_write: 2, admin: 3 } as const;
  return rank[auth.permissions] >= rank[minimum];
}

export function requireApiScope(auth: AuthedKey, scope: string): boolean {
  return (
    auth.permissions === "admin" || auth.scopes.includes("admin") || auth.scopes.includes(scope)
  );
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
    organization_id: row.organization_id,
    permissions: row.permissions,
    scopes: row.scopes,
    environment: row.environment,
    budget_limit_tokens: row.budget_limit_tokens,
    budget_limit_eur: row.budget_limit_eur,
    rate_limit_per_minute: row.rate_limit_per_minute,
  };
}

/**
 * Authentifie soit une clé API Aetheris (sk-aeth-...), soit un JWT utilisateur
 * Supabase (dashboard). Retourne un AuthedKey normalisé.
 */
export async function authenticateRequest(request: Request): Promise<AuthedKey | null> {
  const raw = extractApiKey(request);
  if (!raw) return null;
  if (raw.startsWith("sk-aeth")) return authenticateApiKey(request);

  // JWT utilisateur Supabase
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.auth.getUser(raw);
    if (error || !data.user) return await authenticateApiKey(request);
    return {
      user_id: data.user.id,
      api_key_id: "session",
      organization_id: null,
      permissions: "admin",
      scopes: ["admin"],
      environment: "live",
      budget_limit_tokens: null,
      budget_limit_eur: null,
      rate_limit_per_minute: 0,
    };
  } catch {
    return null;
  }
}

export function jsonResponse(body: unknown, status = 200, request?: Request): Response {
  const id = request ? requestId(request) : crypto.randomUUID();
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...(request ? corsHeadersFor(request) : corsHeaders),
      "Content-Type": "application/json",
      "X-Request-ID": id,
    },
  });
}

export function unauthorizedResponse(
  message = "Clé API invalide ou manquante. Header attendu : 'Authorization: Bearer sk-aeth-...' ou 'X-API-Key: sk-aeth-...'",
  request?: Request,
): Response {
  return jsonResponse({ error: message }, 401, request);
}
