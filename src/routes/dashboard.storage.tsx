import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  HardDrive,
  Database,
  Cpu,
  Sparkles,
  CheckCircle2,
  XCircle,
  Copy,
  ArrowUpRight,
  Gauge,
  KeyRound,
  RefreshCw,
  PlugZap,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/storage")({
  head: () => ({
    meta: [
      { title: "Stockage & Intégrations — Aetheris" },
      {
        name: "description",
        content:
          "Gère tes connecteurs (Lovable AI, HuggingFace, Seaweed, Mongo) et ton index DB de 1 Go offert.",
      },
    ],
  }),
  component: StoragePage,
});

type Status = {
  integrations: {
    lovable_ai: { connected: boolean };
    huggingface: { connected: boolean };
    seaweed: {
      connected: boolean;
      endpoint: string | null;
      bucket: string | null;
      error: string | null;
    };
    mongo: {
      connected: boolean;
      configured: boolean;
      docs_sample: number;
      error: string | null;
    };
  };
  storage: { objects: number; bytes: number; quota_bytes: number };
  db_index: { objects: number; bytes: number; quota_bytes: number };
};

function fmtBytes(n: number) {
  if (n > 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n > 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  if (n > 1e3) return `${(n / 1e3).toFixed(1)} KB`;
  return `${n} B`;
}

function StoragePage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupère la dernière clé API non révoquée
  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return;
      // Note : on lit le hash plain stocké côté client après création.
      // Si pas dispo, l'user devra coller une clé.
      const cached = localStorage.getItem("aetheris.apikey");
      if (cached) setApiKey(cached);
    })();
  }, []);

  const fetchStatus = async (key: string) => {
    if (!key) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/storage-status", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as Status;
      setStatus(j);
      localStorage.setItem("aetheris.apikey", key);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) fetchStatus(apiKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const integ = status?.integrations;
  const usagePct = status
    ? Math.min(100, (status.storage.bytes / status.storage.quota_bytes) * 100)
    : 0;
  const indexPct = status
    ? Math.min(100, (status.db_index.bytes / status.db_index.quota_bytes) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Hero header */}
      <section className="relative overflow-hidden rounded-3xl glass p-8 lg:p-10">
        <div
          aria-hidden
          className="absolute -top-32 -right-32 h-80 w-80 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "conic-gradient(from 180deg, oklch(0.78 0.18 220 / 0.6), oklch(0.65 0.24 295 / 0.5), transparent)",
          }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-primary/80 font-mono">
              Infrastructure · 2026
            </p>
            <h1 className="mt-3 font-display text-4xl lg:text-5xl font-semibold tracking-tight">
              Stockage <span className="italic text-primary">&</span> Intégrations
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Branche tes modèles, ta DB et tes connecteurs IA. Chaque utilisateur
              dispose de <span className="text-primary font-semibold">1 Go gratuit</span> pour son
              index DB sémantique.
            </p>
          </div>
          <button
            onClick={() => fetchStatus(apiKey)}
            disabled={!apiKey || loading}
            className="self-start lg:self-auto inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Rafraîchir
          </button>
        </div>
      </section>

      {/* Clé API input */}
      {!apiKey && (
        <section className="glass rounded-3xl p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="h-4 w-4 text-primary" />
            Clé API requise
          </div>
          <p className="text-sm text-muted-foreground">
            Colle une clé pour afficher l'état. Crées-en une dans{" "}
            <a href="/dashboard/api-keys" className="text-primary underline">
              Clés API
            </a>
            .
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="aether_..."
              className="flex-1 bg-background/50 border border-white/10 rounded-xl px-4 py-2 font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  fetchStatus((e.target as HTMLInputElement).value);
              }}
            />
          </div>
        </section>
      )}

      {error && (
        <div className="glass rounded-2xl p-4 text-sm text-destructive">
          ❌ {error}
        </div>
      )}

      {/* Quotas */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QuotaCard
          icon={<HardDrive className="h-5 w-5" />}
          title="Stockage modèles"
          subtitle="Seaweed VPS · GGUF, safetensors, datasets"
          used={status?.storage.bytes ?? 0}
          quota={status?.storage.quota_bytes ?? 50e9}
          pct={usagePct}
          accent="primary"
          objects={status?.storage.objects ?? 0}
        />
        <QuotaCard
          icon={<Database className="h-5 w-5" />}
          title="DB Index"
          subtitle="Index sémantique · 1 Go offert à chaque user"
          used={status?.db_index.bytes ?? 0}
          quota={status?.db_index.quota_bytes ?? 1e9}
          pct={indexPct}
          accent="cyan"
          objects={status?.db_index.objects ?? 0}
          badge="GRATUIT"
        />
      </section>

      {/* Intégrations / clés API */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Intégrations actives
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            {integ
              ? Object.values(integ).filter((i) => i.connected).length
              : 0}{" "}
            / 4 connectés
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IntegrationCard
            icon={<Sparkles className="h-5 w-5" />}
            name="Lovable AI Gateway"
            desc="Gemini, GPT-5 — sans clé externe"
            connected={integ?.lovable_ai.connected}
            envKey="LOVABLE_API_KEY"
            tag="géré"
          />
          <IntegrationCard
            icon={<Cpu className="h-5 w-5" />}
            name="HuggingFace"
            desc="Inférence sur n'importe quel repo chat"
            connected={integ?.huggingface.connected}
            envKey="HF_TOKEN"
          />
          <IntegrationCard
            icon={<HardDrive className="h-5 w-5" />}
            name="SeaweedFS (S3)"
            desc={
              integ?.seaweed.endpoint
                ? `${integ.seaweed.endpoint} · ${integ.seaweed.bucket}`
                : "Stockage objet sur ton VPS"
            }
            connected={integ?.seaweed.connected}
            envKey="SEAWEED_S3_*"
            error={integ?.seaweed.error ?? undefined}
          />
          <IntegrationCard
            icon={<Database className="h-5 w-5" />}
            name="MongoDB Proxy"
            desc="Métadonnées via proxy HTTP VPS"
            connected={integ?.mongo.connected}
            envKey="MONGO_PROXY_*"
            error={integ?.mongo.error ?? undefined}
            extra={
              integ?.mongo.configured && !integ.mongo.connected
                ? "Configuré mais injoignable — vérifie que le service tourne."
                : undefined
            }
          />
        </div>
      </section>

      {/* Snippet */}
      <section className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-semibold">
            Push un modèle vers ton stockage
          </h3>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `curl -X PUT "$(aetheris push mistral.gguf)" --data-binary @mistral.gguf`,
              );
            }}
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3 w-3" /> Copier
          </button>
        </div>
        <pre className="font-mono text-xs bg-background/50 border border-white/5 rounded-xl p-4 overflow-x-auto text-muted-foreground">
{`# Dans le terminal Aetheris :
push mistral-7b.gguf
# → renvoie une URL pré-signée. Puis en local :
curl -X PUT "<url>" --data-binary @mistral-7b.gguf`}
        </pre>
      </section>
    </div>
  );
}

function QuotaCard({
  icon,
  title,
  subtitle,
  used,
  quota,
  pct,
  accent,
  objects,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  used: number;
  quota: number;
  pct: number;
  accent: "primary" | "cyan";
  objects: number;
  badge?: string;
}) {
  return (
    <div className="relative overflow-hidden glass rounded-3xl p-6 group">
      <div
        aria-hidden
        className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition"
        style={{
          background:
            accent === "primary"
              ? "radial-gradient(circle, oklch(0.65 0.24 295 / 0.7), transparent)"
              : "radial-gradient(circle, oklch(0.78 0.18 220 / 0.7), transparent)",
        }}
      />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
              {icon}
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {badge && (
            <span className="text-[10px] tracking-widest font-mono bg-primary/15 text-primary px-2 py-1 rounded-full border border-primary/30">
              {badge}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold tracking-tight">
              {fmtBytes(used)}
            </span>
            <span className="text-sm text-muted-foreground">
              / {fmtBytes(quota)}
            </span>
          </div>
          <div className="mt-3 h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary shadow-glow-cyan transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2 font-mono">
            <span>{objects} objet(s)</span>
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              {pct.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({
  icon,
  name,
  desc,
  connected,
  envKey,
  tag,
  error,
  extra,
}: {
  icon: React.ReactNode;
  name: string;
  desc: string;
  connected?: boolean;
  envKey: string;
  tag?: string;
  error?: string;
  extra?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3 hover:border-white/20 transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="font-medium">{name}</h3>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-full border ${
            connected
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-white/5 text-muted-foreground border-white/10"
          }`}
        >
          {connected ? (
            <>
              <CheckCircle2 className="h-3 w-3" /> connecté
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" /> off
            </>
          )}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground border-t border-white/5 pt-3">
        <span>{envKey}</span>
        {tag && (
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {tag}
          </span>
        )}
        {!tag && (
          <ArrowUpRight className="h-3 w-3 opacity-50" />
        )}
      </div>
      {error && (
        <p className="text-[11px] text-destructive font-mono">⚠ {error}</p>
      )}
      {extra && (
        <p className="text-[11px] text-muted-foreground italic">{extra}</p>
      )}
    </div>
  );
}
