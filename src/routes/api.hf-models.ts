// GET /api/hf-models — liste les vrais dépôts Hugging Face de l'utilisateur (via sa clé).
// POST /api/hf-models — publie un de ces dépôts dans le Marketplace Aetheris.
import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest, corsHeaders, getServerSupabase, jsonResponse } from "@/lib/api-auth";
import { getHfTokenForUser } from "@/lib/hf-token.server";
import { checkHuggingFaceRepo } from "@/lib/hf-gateway";

type HfRepo = {
  id: string;
  pipeline_tag?: string;
  downloads?: number;
  likes?: number;
  private?: boolean;
  lastModified?: string;
  tags?: string[];
};

const CATEGORIES = ["LLM", "Vision", "Audio", "Outil"];

function categoryFor(pipeline?: string): string {
  if (!pipeline) return "LLM";
  if (pipeline.includes("image") || pipeline.includes("vision")) return "Vision";
  if (pipeline.includes("audio") || pipeline.includes("speech")) return "Audio";
  if (pipeline.includes("text") || pipeline.includes("conversational")) return "LLM";
  return "Outil";
}

export const Route = createFileRoute("/api/hf-models")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      GET: async ({ request }) => {
        const authed = await authenticateRequest(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);
        const token = await getHfTokenForUser(authed.user_id);
        if (!token) {
          return jsonResponse(
            {
              error:
                "Aucune clé Hugging Face enregistrée. Ajoutez-la dans Paramètres pour voir vos modèles.",
              needs_key: true,
            },
            409,
          );
        }

        let whoami: { name?: string; orgs?: Array<{ name?: string }> };
        try {
          const r = await fetch("https://huggingface.co/api/whoami-v2", {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(15_000),
          });
          if (r.status === 401)
            return jsonResponse({ error: "Clé Hugging Face refusée.", needs_key: true }, 401);
          if (!r.ok) return jsonResponse({ error: `Hugging Face HTTP ${r.status}` }, 502);
          whoami = (await r.json()) as typeof whoami;
        } catch (e) {
          return jsonResponse({ error: `Hugging Face injoignable : ${(e as Error).message}` }, 502);
        }

        const authors = [whoami.name, ...(whoami.orgs ?? []).map((o) => o.name)].filter(
          (a): a is string => !!a,
        );

        const repos: HfRepo[] = [];
        for (const author of authors) {
          try {
            const r = await fetch(
              `https://huggingface.co/api/models?author=${encodeURIComponent(author)}&limit=100&full=false`,
              {
                headers: { Authorization: `Bearer ${token}` },
                signal: AbortSignal.timeout(20_000),
              },
            );
            if (r.ok) repos.push(...((await r.json()) as HfRepo[]));
          } catch {
            // on ignore un auteur injoignable, les autres restent listés
          }
        }

        const supabase = getServerSupabase();
        const { data: published } = await supabase
          .from("marketplace_models")
          .select("name")
          .eq("user_id", authed.user_id);
        const publishedNames = new Set((published ?? []).map((p) => p.name));

        return jsonResponse({
          account: whoami.name ?? null,
          items: repos.map((m) => ({
            name: m.id,
            pipeline_tag: m.pipeline_tag ?? null,
            category: categoryFor(m.pipeline_tag),
            downloads: m.downloads ?? 0,
            likes: m.likes ?? 0,
            private: !!m.private,
            last_modified: m.lastModified ?? null,
            url: `https://huggingface.co/${m.id}`,
            published: publishedNames.has(m.id),
          })),
        });
      },

      POST: async ({ request }) => {
        const authed = await authenticateRequest(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);
        let body: { name?: string; description?: string; category?: string; price_eur?: number } =
          {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return jsonResponse({ error: "JSON invalide" }, 400);
        }
        const name = (body.name || "").trim();
        if (!name.includes("/")) {
          return jsonResponse({ error: "Format attendu : <owner>/<repo>" }, 400);
        }

        const token = await getHfTokenForUser(authed.user_id);
        const check = await checkHuggingFaceRepo(name, token);
        if (!check.exists) {
          return jsonResponse(
            { error: `Dépôt introuvable sur Hugging Face : ${check.error ?? "inconnu"}` },
            404,
          );
        }

        const supabase = getServerSupabase();
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", authed.user_id)
          .maybeSingle();
        const author =
          profile?.full_name || (profile?.email ? `@${profile.email.split("@")[0]}` : "@dev");

        const category = CATEGORIES.includes(body.category || "")
          ? body.category!
          : categoryFor(check.pipeline_tag);

        const { data, error } = await supabase
          .from("marketplace_models")
          .upsert(
            {
              user_id: authed.user_id,
              name,
              author,
              description: (body.description || `Modèle Hugging Face ${name}`).slice(0, 500),
              category,
              source: "huggingface",
              source_url: `https://huggingface.co/${name}`,
              price_eur: Number.isFinite(body.price_eur) ? Number(body.price_eur) : 0,
              tags: check.pipeline_tag ? [check.pipeline_tag] : [],
              is_public: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,name" },
          )
          .select("id, name")
          .maybeSingle();
        if (error) return jsonResponse({ error: error.message }, 500);

        return jsonResponse({ ok: true, model: data, message: `Publié : ${name}` }, 201);
      },
    },
  },
});
