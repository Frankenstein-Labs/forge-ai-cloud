// POST /api/mongo-test — vérifie l'accès au proxy MongoDB avec des creds fournis.
import { createFileRoute } from "@tanstack/react-router";
import { authenticateApiKey, corsHeaders, jsonResponse } from "@/lib/api-auth";

type Body = { url?: string; token?: string; collection?: string };

export const Route = createFileRoute("/api/mongo-test")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      POST: async ({ request }) => {
        const authed = await authenticateApiKey(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);

        let body: Body = {};
        try {
          body = (await request.json()) as Body;
        } catch {
          return jsonResponse({ ok: false, stage: "parse", error: "Body JSON invalide" }, 400);
        }

        const url = (body.url || "").trim().replace(/\/$/, "");
        const token = (body.token || "").trim();
        const collection = body.collection || "models";

        if (!url)
          return jsonResponse({ ok: false, stage: "validate", error: "URL manquante" }, 400);
        if (!token)
          return jsonResponse({ ok: false, stage: "validate", error: "Token manquant" }, 400);
        if (!/^https?:\/\//i.test(url))
          return jsonResponse(
            { ok: false, stage: "validate", error: "URL doit commencer par http:// ou https://" },
            400,
          );

        const target = `${url}/find`;
        const t0 = Date.now();
        let resp: Response;
        try {
          resp = await fetch(target, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-proxy-token": token,
            },
            body: JSON.stringify({
              collection,
              filter: { user_id: authed.user_id },
              limit: 1,
            }),
            signal: AbortSignal.timeout(8000),
          });
        } catch (e) {
          const err = e as Error;
          return jsonResponse(
            {
              ok: false,
              stage: "network",
              target,
              error: err.message,
              hint:
                err.name === "TimeoutError"
                  ? "Le proxy n'a pas répondu en 8s. Vérifie que PM2 tourne et que le port est ouvert."
                  : "DNS / TLS / pare-feu ? Teste avec curl depuis ta machine.",
            },
            502,
          );
        }

        const elapsed = Date.now() - t0;
        const text = await resp.text().catch(() => "");

        if (!resp.ok) {
          return jsonResponse(
            {
              ok: false,
              stage: "http",
              target,
              status: resp.status,
              statusText: resp.statusText,
              body: text.slice(0, 500),
              elapsed_ms: elapsed,
              hint:
                resp.status === 401 || resp.status === 403
                  ? "Token rejeté. Vérifie PROXY_TOKEN sur le VPS (pm2 restart mongo-proxy après changement)."
                  : resp.status === 404
                    ? "Endpoint /find introuvable. Vérifie /opt/mongo-proxy/server.js."
                    : "Le proxy a répondu mais en erreur. Regarde les logs : pm2 logs mongo-proxy.",
            },
            200,
          );
        }

        let parsed: unknown = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          return jsonResponse({
            ok: false,
            stage: "parse-response",
            target,
            body: text.slice(0, 500),
            error: "Le proxy n'a pas renvoyé du JSON.",
          });
        }

        return jsonResponse({
          ok: true,
          stage: "ok",
          target,
          elapsed_ms: elapsed,
          response: parsed,
          message: "Proxy MongoDB joignable et token valide ✅",
        });
      },
    },
  },
});
