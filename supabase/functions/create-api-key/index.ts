// Edge function: génère une clé API, la hash en SHA-256, la stocke et la retourne UNE SEULE FOIS au client.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Permission = "read_only" | "read_write" | "admin";

interface CreateKeyRequest {
  name: string;
  permissions?: Permission;
  budget_limit_tokens?: number | null;
  expires_at?: string | null;
}

function generateApiKey(): { full: string; prefix: string } {
  // ae_live_<32 base36 chars>
  const random = new Uint8Array(24);
  crypto.getRandomValues(random);
  const body = Array.from(random)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 32);
  const full = `ae_live_${body}`;
  const prefix = full.slice(0, 14); // "ae_live_" + 6 chars
  return { full, prefix };
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Session invalide" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CreateKeyRequest = await req.json();
    if (!body.name || body.name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Nom requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { full, prefix } = generateApiKey();
    const hashed = await sha256(full);

    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        key_prefix: prefix,
        hashed_key: hashed,
        permissions: body.permissions ?? "read_write",
        budget_limit_tokens: body.budget_limit_tokens ?? null,
        expires_at: body.expires_at ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        api_key: full, // affichée UNE SEULE FOIS
        record: data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur inconnue" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
