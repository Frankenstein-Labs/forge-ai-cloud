import { useCallback, useEffect, useRef, useState } from "react";
import { authJson } from "@/lib/api-client";

export type EngineMetrics = {
  cpu: number;
  ram: number;
  disk: number;
  uptime_seconds: number;
};

export type Engine = {
  id: string;
  name: string;
  image: string;
  region: string;
  cpu_cores: number;
  ram_gb: number;
  disk_gb: number;
  status: "running" | "stopped" | "restarting" | string;
  price_per_hour: number;
  vscode_url: string | null;
  last_started_at: string | null;
  metrics: EngineMetrics;
};

export type EngineEvent = {
  id: string;
  engine_id: string | null;
  action: string;
  status: "ok" | "error";
  message: string;
  created_at: string;
};

type EnginesResponse = {
  engines: Engine[];
  events: EngineEvent[];
  server_time: string;
};

export type EngineAction = "start" | "stop" | "restart" | "vscode" | "pull-model";

/** Charge les moteurs et rafraîchit l'état/les métriques toutes les `intervalMs`. */
export function useEngines(intervalMs = 4000) {
  const [engines, setEngines] = useState<Engine[]>([]);
  const [events, setEvents] = useState<EngineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const data = await authJson<EnginesResponse>("/api/engines");
      setEngines(data.engines ?? []);
      setEvents(data.events ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, intervalMs]);

  const runAction = useCallback(
    async (action: EngineAction, engineId?: string, model?: string) => {
      setBusy(`${action}:${engineId ?? "default"}`);
      try {
        const res = await authJson<{
          ok: boolean;
          message: string;
          engine: Engine;
          url?: string;
        }>("/api/engines", {
          method: "POST",
          body: JSON.stringify({ action, engine_id: engineId, model }),
        });
        setEngines((prev) =>
          prev.some((e) => e.id === res.engine.id)
            ? prev.map((e) => (e.id === res.engine.id ? res.engine : e))
            : [...prev, res.engine],
        );
        void refresh();
        return res;
      } finally {
        setBusy(null);
      }
    },
    [refresh],
  );

  return { engines, events, loading, error, busy, refresh, runAction };
}

export function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}
