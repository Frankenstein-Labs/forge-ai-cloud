// GET /api/storage-status — agrège l'état des intégrations + quota Seaweed/index.
import { createFileRoute } from "@tanstack/react-router";
import {
  authenticateApiKey,
  corsHeaders,
  jsonResponse,
} from "@/lib/api-auth";
import {
  getSeaweedConfig,
  s3List,
  userPrefix,
} from "@/lib/seaweed";
import { getMongoConfig, mongo } from "@/lib/mongo-proxy";

const ONE_GB = 1_000_000_000;

export const Route = createFileRoute("/api/storage-status")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),

      GET: async ({ request }) => {
        const authed = await authenticateApiKey(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);

        const seaweed = getSeaweedConfig();
        const mongoCfg = getMongoConfig();
        const hasHF = !!process.env.HF_TOKEN;
        const hasLovable = !!process.env.LOVABLE_API_KEY;

        // Stockage Seaweed (modèles lourds)
        let storageBytes = 0;
        let storageObjects = 0;
        let storageError: string | null = null;
        if (seaweed) {
          try {
            const objs = await s3List(seaweed, userPrefix(authed.user_id), 1000);
            storageObjects = objs.length;
            storageBytes = objs.reduce((s, o) => s + o.size, 0);
          } catch (e) {
            storageError = (e as Error).message;
          }
        }

        // DB index (préfixe dédié sur Seaweed: users/<id>/_index/)
        let indexBytes = 0;
        let indexObjects = 0;
        if (seaweed && !storageError) {
          try {
            const idx = await s3List(
              seaweed,
              `${userPrefix(authed.user_id)}_index/`,
              1000,
            );
            indexObjects = idx.length;
            indexBytes = idx.reduce((s, o) => s + o.size, 0);
          } catch {
            // ignore
          }
        }

        // Mongo : ping
        let mongoOk = false;
        let mongoDocs = 0;
        let mongoError: string | null = null;
        if (mongoCfg) {
          try {
            const docs = await mongo.find(
              mongoCfg,
              "models",
              { user_id: authed.user_id },
              { limit: 1 },
            );
            mongoOk = true;
            mongoDocs = docs.length;
          } catch (e) {
            mongoError = (e as Error).message;
          }
        }

        return jsonResponse({
          integrations: {
            lovable_ai: { connected: hasLovable },
            huggingface: { connected: hasHF },
            seaweed: {
              connected: !!seaweed,
              endpoint: seaweed?.endpoint ?? null,
              bucket: seaweed?.bucket ?? null,
              error: storageError,
            },
            mongo: {
              connected: !!mongoCfg && mongoOk,
              configured: !!mongoCfg,
              docs_sample: mongoDocs,
              error: mongoError,
            },
          },
          storage: {
            objects: storageObjects,
            bytes: storageBytes,
            quota_bytes: 50 * ONE_GB,
          },
          db_index: {
            objects: indexObjects,
            bytes: indexBytes,
            quota_bytes: ONE_GB, // 1 Go gratuit
          },
        });
      },
    },
  },
});
