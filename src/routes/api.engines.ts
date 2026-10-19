// Infrastructure operations stay unavailable until a verified real provider is attached.
import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest, corsHeaders, jsonResponse } from "@/lib/api-auth";
import { unavailableEngineAction } from "@/lib/engine-policy";
export const Route = createFileRoute("/api/engines")({ server: { handlers: {
 OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
 GET: async ({ request }) => {
  const auth = await authenticateRequest(request);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
  return jsonResponse({ engines: [], events: [], configured: false, message: "Aucun fournisseur de conteneurs réel n’est connecté à Aetheris.", server_time: new Date().toISOString() });
 },
 POST: async ({ request }) => {
  const auth = await authenticateRequest(request);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
  return jsonResponse(unavailableEngineAction(), 503);
 },
} } });
