// Creates a one-time API key. The plaintext key is never persisted by Aetheris.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Permission = "read_only" | "read_write" | "admin";
type Environment = "test" | "live";

const ALLOWED_SCOPES = new Set([
  "inference:chat",
  "models:read",
  "storage:read",
  "storage:write",
  "admin",
]);
const ROLE_RANK = { member: 1, analyst: 1, developer: 2, billing: 2, admin: 3, owner: 4 };

interface CreateKeyRequest {
  name: string;
  permissions?: Permission;
  scopes?: string[];
  environment?: Environment;
  budget_limit_tokens?: number | null;
  budget_limit_eur?: number | null;
  rate_limit_per_minute?: number;
  expires_at?: string | null;
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    ...(origin && allowed.includes(origin)
      ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
      : {}),
  };
}

function response(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

function generateApiKey(environment: Environment): { full: string; prefix: string } {
  const random = new Uint8Array(24);
  crypto.getRandomValues(random);
  const body = Array.from(random)
    .map((byte) => byte.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 32);
  const full = `ae_${environment}_${body}`;
  return { full, prefix: full.slice(0, 14) };
}

async function sha256(input: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function validDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf()) || date <= new Date()) throw new Error("INVALID_EXPIRY");
  return date.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST") return response(req, { error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!authorization || !supabaseUrl || !supabaseAnonKey) {
      return response(req, { error: "UNAUTHORIZED" }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return response(req, { error: "UNAUTHORIZED" }, 401);

    const body = (await req.json()) as CreateKeyRequest;
    const name = body.name?.trim();
    if (!name || name.length > 120) return response(req, { error: "INVALID_NAME" }, 400);

    const environment = body.environment ?? "live";
    if (environment !== "test" && environment !== "live") {
      return response(req, { error: "INVALID_ENVIRONMENT" }, 400);
    }
    if (body.permissions && !["read_only", "read_write", "admin"].includes(body.permissions)) {
      return response(req, { error: "INVALID_PERMISSION" }, 400);
    }
    if (body.scopes !== undefined && !Array.isArray(body.scopes)) {
      return response(req, { error: "INVALID_SCOPE" }, 400);
    }
    const scopes = body.scopes?.length ? [...new Set(body.scopes)] : ["inference:chat"];
    if (scopes.some((scope) => !ALLOWED_SCOPES.has(scope))) {
      return response(req, { error: "INVALID_SCOPE" }, 400);
    }
    const rateLimit = body.rate_limit_per_minute ?? 60;
    if (!Number.isInteger(rateLimit) || rateLimit < 1 || rateLimit > 10000) {
      return response(req, { error: "INVALID_RATE_LIMIT" }, 400);
    }
    const budgetTokens = body.budget_limit_tokens ?? null;
    const budgetEur = body.budget_limit_eur ?? null;
    if (
      (budgetTokens !== null && (!Number.isSafeInteger(budgetTokens) || budgetTokens < 0)) ||
      (budgetEur !== null && (!Number.isFinite(budgetEur) || budgetEur < 0))
    ) {
      return response(req, { error: "INVALID_BUDGET" }, 400);
    }

    const { data: preferences, error: preferencesError } = await supabase
      .from("user_preferences")
      .select("active_organization_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (preferencesError || !preferences?.active_organization_id) {
      return response(req, { error: "ACTIVE_ORGANIZATION_REQUIRED" }, 409);
    }

    const { data: membership, error: membershipError } = await supabase
      .from("organization_memberships")
      .select("role")
      .eq("organization_id", preferences.active_organization_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    const role = membership?.role as keyof typeof ROLE_RANK | undefined;
    if (membershipError || !role || ROLE_RANK[role] < ROLE_RANK.developer) {
      return response(req, { error: "INSUFFICIENT_ORGANIZATION_ROLE" }, 403);
    }
    if (
      (body.permissions === "admin" || scopes.includes("admin")) &&
      ROLE_RANK[role] < ROLE_RANK.admin
    ) {
      return response(req, { error: "ADMIN_ROLE_REQUIRED" }, 403);
    }

    const { full, prefix } = generateApiKey(environment);
    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        user_id: userData.user.id,
        organization_id: preferences.active_organization_id,
        name,
        key_prefix: prefix,
        hashed_key: await sha256(full),
        permissions: body.permissions ?? "read_write",
        scopes,
        environment,
        budget_limit_tokens: budgetTokens,
        budget_limit_eur: budgetEur,
        rate_limit_per_minute: rateLimit,
        expires_at: validDate(body.expires_at),
      })
      .select()
      .single();

    if (error) return response(req, { error: "KEY_CREATION_FAILED" }, 500);
    return response(req, { api_key: full, record: data }, 201);
  } catch (error) {
    const code =
      error instanceof Error && error.message === "INVALID_EXPIRY"
        ? "INVALID_EXPIRY"
        : "INVALID_REQUEST";
    return response(req, { error: code }, 400);
  }
});
