// GET/POST/DELETE /api/mongo-config — gère la config MongoDB proxy par utilisateur.
import { createFileRoute } from "@tanstack/react-router";
import {
  authenticateApiKey,
  corsHeaders,
  getServerSupabase,
  jsonResponse,
} from "@/lib/api-auth";

type Body = { url?: string; token?: string };

export const Route = createFileRoute("/api/mongo-config")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),

      GET: async ({ request }) => {
        const authed = await authenticateApiKey(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);
        const supabase = getServerSupabase();
        const { data } = await supabase
          .from("user_mongo_config" as never)
          .select("url, updated_at")
          .eq("user_id", authed.user_id)
          .maybeSingle();
        const row = data as { url?: string; updated_at?: string } | null;
        return jsonResponse({
          configured: !!row,
          url: row?.url ?? null,
          updated_at: row?.updated_at ?? null,
        });
      },

      POST: async ({ request }) => {
        const authed = await authenticateApiKey(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);
        let body: Body = {};
        try {
          body = (await request.json()) as Body;
        } catch {
          return jsonResponse({ error: "JSON invalide" }, 400);
        }
        const url = (body.url || "").trim().replace(/\/$/, "");
        const token = (body.token || "").trim();
        if (!url || !/^https?:\/\//i.test(url))
          return jsonResponse({ error: "URL invalide" }, 400);
        if (!token) return jsonResponse({ error: "Token manquant" }, 400);

        const supabase = getServerSupabase();
        const { error } = await supabase
          .from("user_mongo_config" as never)
          .upsert(
            {
              user_id: authed.user_id,
              url,
              token,
              updated_at: new Date().toISOString(),
            } as never,
            { onConflict: "user_id" },
          );
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ ok: true, message: "Config enregistrée ✅" });
      },

      DELETE: async ({ request }) => {
        const authed = await authenticateApiKey(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);
        const supabase = getServerSupabase();
        const { error } = await supabase
          .from("user_mongo_config" as never)
          .delete()
          .eq("user_id", authed.user_id);
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ ok: true });
      },
    },
  },
});
