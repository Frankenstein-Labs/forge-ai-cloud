// GET  /api/marketplace        — liste les modèles publiés (filtres: q, category, mine)
// POST /api/marketplace        — publie un modèle (auteur = utilisateur courant)
// DELETE /api/marketplace?id=  — dépublie un de ses modèles
import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest, corsHeaders, getServerSupabase, jsonResponse } from "@/lib/api-auth";
import { checkHuggingFaceRepo } from "@/lib/hf-gateway";

type PublishBody = {
  name?: string;
  description?: string;
  category?: string;
  source?: "huggingface" | "upload" | "lovable";
  source_url?: string;
  storage_path?: string;
  price_eur?: number;
  tags?: string[];
  is_public?: boolean;
};

const CATEGORIES = ["LLM", "Vision", "Audio", "Outil"];

export const Route = createFileRoute("/api/marketplace")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") || "").trim();
        const category = url.searchParams.get("category") || "";
        const mine = url.searchParams.get("mine") === "1";

        const authed = await authenticateRequest(request);
        if (mine && !authed) return jsonResponse({ error: "Unauthorized" }, 401);

        const supabase = getServerSupabase();
        let query = supabase
          .from("marketplace_models" as never)
          .select(
            "id, user_id, name, author, description, category, source, source_url, storage_path, size_bytes, price_eur, tags, is_public, downloads, stars, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(100);

        if (mine && authed) query = query.eq("user_id", authed.user_id);
        else query = query.eq("is_public", true);
        if (category && category !== "Tous") query = query.eq("category", category);
        if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);

        const { data, error } = await query;
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ items: data ?? [], authenticated: !!authed });
      },

      POST: async ({ request }) => {
        const authed = await authenticateRequest(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);

        let body: PublishBody = {};
        try {
          body = (await request.json()) as PublishBody;
        } catch {
          return jsonResponse({ error: "JSON invalide" }, 400);
        }

        const name = (body.name || "").trim();
        if (!name) return jsonResponse({ error: "Le nom du modèle est requis." }, 400);
        const source = body.source || "huggingface";
        const category = CATEGORIES.includes(body.category || "") ? body.category! : "LLM";

        let source_url = body.source_url?.trim() || null;
        let size_bytes: number | null = null;

        if (source === "huggingface") {
          if (!name.includes("/")) {
            return jsonResponse({ error: "Format attendu : <owner>/<repo> (HuggingFace)." }, 400);
          }
          const check = await checkHuggingFaceRepo(name);
          if (!check.exists) {
            return jsonResponse(
              { error: `Repo introuvable sur HuggingFace : ${check.error ?? "inconnu"}` },
              404,
            );
          }
          source_url = source_url || `https://huggingface.co/${name}`;
        }

        const supabase = getServerSupabase();

        // Auteur lisible depuis le profil
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", authed.user_id)
          .maybeSingle();
        const author =
          profile?.full_name || (profile?.email ? `@${profile.email.split("@")[0]}` : "@dev");

        const { data, error } = await supabase
          .from("marketplace_models" as never)
          .insert({
            user_id: authed.user_id,
            name,
            author,
            description: (body.description || "").slice(0, 500),
            category,
            source,
            source_url,
            storage_path: body.storage_path ?? null,
            size_bytes,
            price_eur: Number.isFinite(body.price_eur) ? body.price_eur : 0,
            tags: body.tags ?? [],
            is_public: body.is_public !== false,
          } as never)
          .select("id, name")
          .maybeSingle();

        if (error) return jsonResponse({ error: error.message }, 500);

        // Ajoute aussi le modèle à la bibliothèque personnelle
        await supabase.from("user_models").insert({
          user_id: authed.user_id,
          name,
          source: source === "huggingface" ? "huggingface" : "upload",
          source_url,
        } as never);

        return jsonResponse({ ok: true, model: data, message: `Modèle publié : ${name}` }, 201);
      },

      DELETE: async ({ request }) => {
        const authed = await authenticateRequest(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);
        const id = new URL(request.url).searchParams.get("id");
        if (!id) return jsonResponse({ error: "Paramètre id manquant" }, 400);
        const supabase = getServerSupabase();
        const { error } = await supabase
          .from("marketplace_models" as never)
          .delete()
          .eq("id", id)
          .eq("user_id", authed.user_id);
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ ok: true });
      },
    },
  },
});
