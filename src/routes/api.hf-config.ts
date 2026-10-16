// GET/POST/DELETE /api/hf-config — gère la clé API HuggingFace de chaque utilisateur.
import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest, corsHeaders, getServerSupabase, jsonResponse } from "@/lib/api-auth";

type Body = { token?: string; label?: string };

function maskToken(token: string) {
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

export const Route = createFileRoute("/api/hf-config")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      GET: async ({ request }) => {
        const authed = await authenticateRequest(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);
        const supabase = getServerSupabase();
        const { data } = await supabase
          .from("user_hf_config")
          .select("token, label, updated_at")
          .eq("user_id", authed.user_id)
          .maybeSingle();
        const row = data as { token?: string; label?: string; updated_at?: string } | null;
        return jsonResponse({
          configured: !!row?.token,
          masked: row?.token ? maskToken(row.token) : null,
          label: row?.label ?? null,
          updated_at: row?.updated_at ?? null,
          server_fallback: !!process.env.HF_TOKEN,
        });
      },

      POST: async ({ request }) => {
        const authed = await authenticateRequest(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);
        let body: Body = {};
        try {
          body = (await request.json()) as Body;
        } catch {
          return jsonResponse({ error: "JSON invalide" }, 400);
        }
        const token = (body.token || "").trim();
        if (!token.startsWith("hf_") || token.length < 20) {
          return jsonResponse({ error: "Clé HuggingFace invalide (format attendu : hf_…)" }, 400);
        }

        // Vérifie la clé auprès de HuggingFace avant de l'enregistrer.
        let whoami: { name?: string } | null = null;
        try {
          const r = await fetch("https://huggingface.co/api/whoami-v2", {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(15_000),
          });
          if (r.status === 401) return jsonResponse({ error: "Clé refusée par HuggingFace" }, 400);
          if (!r.ok) return jsonResponse({ error: `HuggingFace HTTP ${r.status}` }, 502);
          whoami = (await r.json()) as { name?: string };
        } catch (e) {
          return jsonResponse({ error: `Vérification impossible : ${(e as Error).message}` }, 502);
        }

        const supabase = getServerSupabase();
        const { error } = await supabase.from("user_hf_config").upsert(
          {
            user_id: authed.user_id,
            token,
            label: body.label?.trim() || whoami?.name || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({
          ok: true,
          message: `Clé HuggingFace validée${whoami?.name ? ` (compte ${whoami.name})` : ""} ✅`,
          masked: maskToken(token),
          label: whoami?.name ?? null,
        });
      },

      DELETE: async ({ request }) => {
        const authed = await authenticateRequest(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);
        const supabase = getServerSupabase();
        const { error } = await supabase
          .from("user_hf_config")
          .delete()
          .eq("user_id", authed.user_id);
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ ok: true });
      },
    },
  },
});
