// GET  /api/engines           — liste les moteurs de l'utilisateur + métriques + journal
// POST /api/engines           — actions : start | stop | restart | vscode | pull-model
import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest, corsHeaders, getServerSupabase, jsonResponse } from "@/lib/api-auth";
import { checkHuggingFaceRepo } from "@/lib/hf-gateway";

type EngineRow = {
  id: string;
  user_id: string;
  name: string;
  image: string;
  region: string;
  cpu_cores: number;
  ram_gb: number;
  disk_gb: number;
  status: string;
  price_per_hour: number;
  vscode_url: string | null;
  last_started_at: string | null;
  updated_at: string;
  created_at: string;
};

type ActionBody = { action?: string; engine_id?: string; model?: string };

const RESTART_MS = 6000;

/** Métriques déterministes (pas de GPU réel côté edge) : varient dans le temps. */
function metricsFor(engine: EngineRow) {
  if (engine.status !== "running") {
    return { cpu: 0, ram: 0, disk: 0, uptime_seconds: 0 };
  }
  const started = engine.last_started_at ? new Date(engine.last_started_at).getTime() : Date.now();
  const uptime = Math.max(0, Math.floor((Date.now() - started) / 1000));
  const seed = (Math.floor(Date.now() / 2000) + engine.name.length) % 1000;
  const cpu = 12 + (Math.sin(seed / 7) + 1) * 22;
  const ram = 28 + (Math.cos(seed / 11) + 1) * 18;
  const disk = 24 + ((engine.name.length * 3) % 20);
  return {
    cpu: Math.round(cpu),
    ram: Math.round(ram),
    disk,
    uptime_seconds: uptime,
  };
}

async function logEvent(
  supabase: ReturnType<typeof getServerSupabase>,
  userId: string,
  engineId: string | null,
  action: string,
  status: "ok" | "error",
  message: string,
) {
  await supabase.from("engine_events" as never).insert({
    user_id: userId,
    engine_id: engineId,
    action,
    status,
    message,
  } as never);
}

async function loadEngines(
  supabase: ReturnType<typeof getServerSupabase>,
  userId: string,
): Promise<EngineRow[]> {
  const { data } = await supabase
    .from("engines" as never)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  let rows = (data ?? []) as unknown as EngineRow[];

  if (rows.length === 0) {
    const { data: created } = await supabase
      .from("engines" as never)
      .insert({
        user_id: userId,
        name: "aetheris-dev-eu-1",
        image: "ghcr.io/aetheris/dev:latest",
        region: "EU · Paris",
        status: "running",
        last_started_at: new Date().toISOString(),
      } as never)
      .select("*");
    rows = (created ?? []) as unknown as EngineRow[];
  }

  // Transition automatique restarting -> running
  const now = Date.now();
  for (const e of rows) {
    if (e.status === "restarting" && now - new Date(e.updated_at).getTime() > RESTART_MS) {
      await supabase
        .from("engines" as never)
        .update({ status: "running", last_started_at: new Date().toISOString() } as never)
        .eq("id", e.id);
      e.status = "running";
      e.last_started_at = new Date().toISOString();
    }
  }
  return rows;
}

export const Route = createFileRoute("/api/engines")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      GET: async ({ request }) => {
        const authed = await authenticateRequest(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);
        const supabase = getServerSupabase();
        const engines = await loadEngines(supabase, authed.user_id);

        const { data: events } = await supabase
          .from("engine_events" as never)
          .select("id, engine_id, action, status, message, created_at")
          .eq("user_id", authed.user_id)
          .order("created_at", { ascending: false })
          .limit(20);

        return jsonResponse({
          engines: engines.map((e) => ({ ...e, metrics: metricsFor(e) })),
          events: events ?? [],
          server_time: new Date().toISOString(),
        });
      },

      POST: async ({ request }) => {
        const authed = await authenticateRequest(request);
        if (!authed) return jsonResponse({ error: "Unauthorized" }, 401);

        let body: ActionBody = {};
        try {
          body = (await request.json()) as ActionBody;
        } catch {
          return jsonResponse({ error: "JSON invalide" }, 400);
        }
        const action = body.action || "";
        const supabase = getServerSupabase();
        const engines = await loadEngines(supabase, authed.user_id);
        const engine = body.engine_id ? engines.find((e) => e.id === body.engine_id) : engines[0];
        if (!engine) return jsonResponse({ error: "Moteur introuvable" }, 404);

        const finish = async (status: "ok" | "error", message: string, extra?: object) => {
          await logEvent(supabase, authed.user_id, engine.id, action, status, message);
          const { data } = await supabase
            .from("engines" as never)
            .select("*")
            .eq("id", engine.id)
            .maybeSingle();
          const fresh = (data as unknown as EngineRow) ?? engine;
          return jsonResponse(
            {
              ok: status === "ok",
              message,
              engine: { ...fresh, metrics: metricsFor(fresh) },
              ...extra,
            },
            status === "ok" ? 200 : 400,
          );
        };

        switch (action) {
          case "start": {
            if (engine.status === "running") return finish("ok", "Le moteur est déjà en cours.");
            await supabase
              .from("engines" as never)
              .update({ status: "running", last_started_at: new Date().toISOString() } as never)
              .eq("id", engine.id);
            return finish("ok", `Moteur ${engine.name} démarré`);
          }
          case "stop": {
            if (engine.status === "stopped") return finish("ok", "Le moteur est déjà arrêté.");
            await supabase
              .from("engines" as never)
              .update({ status: "stopped", last_started_at: null } as never)
              .eq("id", engine.id);
            return finish("ok", `Moteur ${engine.name} arrêté`);
          }
          case "restart": {
            await supabase
              .from("engines" as never)
              .update({ status: "restarting" } as never)
              .eq("id", engine.id);
            return finish("ok", `Redémarrage de ${engine.name} en cours…`);
          }
          case "vscode": {
            if (engine.status !== "running") {
              return finish("error", "Démarrez le moteur avant d'ouvrir VS Code.");
            }
            const base = process.env.CODER_BASE_URL;
            const url = engine.vscode_url || (base ? `${base}/@me/${engine.name}/apps/code` : null);
            if (!url) {
              return finish(
                "error",
                "Aucune URL VS Code configurée pour ce moteur (CODER_BASE_URL manquante).",
              );
            }
            return finish("ok", `Ouverture de VS Code pour ${engine.name}`, { url });
          }
          case "pull-model": {
            const model = (body.model || "").trim();
            if (!model) return finish("error", "Nom de modèle manquant.");
            if (engine.status !== "running") {
              return finish("error", "Démarrez le moteur avant de télécharger un modèle.");
            }
            const repo = model.startsWith("hf/") ? model.slice(3) : model;
            if (repo.includes("/")) {
              const check = await checkHuggingFaceRepo(repo);
              if (!check.exists) {
                return finish("error", `Repo HuggingFace introuvable : ${repo}`);
              }
            }
            await supabase.from("user_models").insert({
              user_id: authed.user_id,
              name: repo,
              source: "huggingface",
              source_url: `https://huggingface.co/${repo}`,
            } as never);
            return finish("ok", `Modèle ${repo} ajouté au moteur ${engine.name}`, {
              cli: `pull ${repo}`,
            });
          }
          default:
            return jsonResponse({ error: `Action inconnue : ${action}` }, 400);
        }
      },
    },
  },
});
