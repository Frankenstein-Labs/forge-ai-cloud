// POST /api/marketplace/download — génère un lien de téléchargement pour un modèle
// et journalise l'opération sur le compte de l'utilisateur.
import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest, corsHeaders, getServerSupabase, jsonResponse } from "@/lib/api-auth";
import { getSeaweedConfig, presignGet } from "@/lib/seaweed";

type Body = { id?: string };

type ModelRow = {
  id: string;
  name: string;
  source: string;
  source_url: string | null;
  storage_path: string | null;
  downloads: number;
  is_public: boolean;
  user_id: string;
};

export const Route = createFileRoute("/api/marketplace/download")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      POST: async ({ request }) => {
        const authed = await authenticateRequest(request);
        if (!authed) {
          return jsonResponse(
            { error: "Connectez-vous pour télécharger depuis votre compte." },
            401,
          );
        }
        let body: Body = {};
        try {
          body = (await request.json()) as Body;
        } catch {
          return jsonResponse({ error: "JSON invalide" }, 400);
        }
        if (!body.id) return jsonResponse({ error: "Paramètre id manquant" }, 400);

        const supabase = getServerSupabase();
        const { data, error } = await supabase
          .from("marketplace_models" as never)
          .select("id, name, source, source_url, storage_path, downloads, is_public, user_id")
          .eq("id", body.id)
          .maybeSingle();
        const model = data as ModelRow | null;
        if (error) return jsonResponse({ error: error.message }, 500);
        if (!model) return jsonResponse({ error: "Modèle introuvable" }, 404);
        if (!model.is_public && model.user_id !== authed.user_id) {
          return jsonResponse({ error: "Modèle privé" }, 403);
        }

        let url: string | null = null;
        let kind = "external";

        if (model.storage_path) {
          const cfg = getSeaweedConfig();
          if (cfg) {
            try {
              const signed = await presignGet(cfg, model.storage_path, 3600);
              url = signed.url;
              kind = "seaweed";
            } catch (e) {
              return jsonResponse({ error: `Stockage : ${(e as Error).message}` }, 502);
            }
          } else {
            const signed = await supabase.storage
              .from("configs-agents")
              .createSignedUrl(model.storage_path, 3600);
            if (signed.data?.signedUrl) {
              url = signed.data.signedUrl;
              kind = "supabase";
            }
          }
        }

        if (!url) {
          url = model.source_url ?? `https://huggingface.co/${model.name}`;
          kind = "huggingface";
        }

        // Journalisation + compteur
        await supabase
          .from("marketplace_downloads" as never)
          .insert({ model_id: model.id, user_id: authed.user_id } as never);
        await supabase
          .from("marketplace_models" as never)
          .update({ downloads: (model.downloads ?? 0) + 1 } as never)
          .eq("id", model.id);

        // Ajoute à la bibliothèque personnelle si absent
        const { data: existing } = await supabase
          .from("user_models")
          .select("id")
          .eq("user_id", authed.user_id)
          .eq("name", model.name)
          .maybeSingle();
        if (!existing) {
          await supabase.from("user_models").insert({
            user_id: authed.user_id,
            name: model.name,
            source: model.source === "huggingface" ? "huggingface" : "upload",
            source_url: model.source_url,
            storage_path: model.storage_path,
          } as never);
        }

        return jsonResponse({
          ok: true,
          kind,
          url,
          cli:
            kind === "huggingface"
              ? `huggingface-cli download ${model.name}`
              : `curl -L "${url}" -o "${model.name.split("/").pop()}"`,
          message: `Lien généré pour ${model.name}`,
        });
      },
    },
  },
});
