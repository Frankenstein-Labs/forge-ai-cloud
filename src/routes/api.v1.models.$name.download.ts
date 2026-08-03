// GET /api/v1/models/:name/download
// Authentifié par clé API. Redirige (302) vers une URL S3 pré-signée Seaweed
// pour le fichier {name} appartenant à l'utilisateur de la clé.
import { createFileRoute } from "@tanstack/react-router";
import { authenticateApiKey, corsHeaders, jsonResponse } from "@/lib/api-auth";
import { getSeaweedConfig, presignGet, s3Head, userObjectKey } from "@/lib/seaweed";

export const Route = createFileRoute("/api/v1/models/$name/download")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      GET: async ({ request, params }) => {
        const authed = await authenticateApiKey(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);

        const cfg = getSeaweedConfig();
        if (!cfg) return jsonResponse({ error: "Storage not configured" }, 503);

        let key: string;
        try {
          key = userObjectKey(authed.user_id, params.name);
        } catch (e) {
          return jsonResponse({ error: (e as Error).message }, 400);
        }

        const head = await s3Head(cfg, key);
        if (!head) return jsonResponse({ error: "Not found" }, 404);

        const { url } = await presignGet(cfg, key, 3600);
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, Location: url },
        });
      },
    },
  },
});
