// Endpoint de test pour le middleware X-API-Key.
// Vérifie la clé envoyée dans le header X-API-Key (ou Authorization: Bearer ...)
// puis renvoie l'identité du propriétaire (user_id, permissions, budget).
// Utilisez ce même pattern dans toutes les routes /api/ai/*.
import { createFileRoute } from "@tanstack/react-router";
import { apiError, authenticateApiKey, corsHeadersFor, jsonResponse } from "@/lib/api-auth";

/**
 * Réutilise cette fonction dans toutes tes routes IA.
 * Retourne null si invalide → renvoie 401.
 */
export const Route = createFileRoute("/api/ai/validate")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        new Response(null, { status: 204, headers: corsHeadersFor(request) }),

      GET: async ({ request }) => {
        const auth = await authenticateApiKey(request);
        if (!auth) {
          return apiError(request, 401, "UNAUTHORIZED", "Clé API invalide ou manquante.");
        }
        return jsonResponse(
          {
            ok: true,
            user_id: auth.user_id,
            permissions: auth.permissions,
            budget_limit_tokens: auth.budget_limit_tokens,
            message: "Clé valide. Tu peux appeler les routes /api/ai/*.",
          },
          200,
          request,
        );
      },
    },
  },
});
