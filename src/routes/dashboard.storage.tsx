import { Button } from "@/components/ui/button";
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
import { HfKeyCard } from "@/components/dashboard/HfKeyCard";
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

type MongoTestResult = {
  ok: boolean;
  stage: string;
  target?: string;
  status?: number;
  statusText?: string;
  body?: string;
  elapsed_ms?: number;
  error?: string;
  hint?: string;
  message?: string;
  response?: unknown;
};

function StoragePage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [mongoUrl, setMongoUrl] = useState<string>("");
  const [mongoToken, setMongoToken] = useState<string>("");
  const [mongoTesting, setMongoTesting] = useState(false);
  const [mongoSaving, setMongoSaving] = useState(false);
  const [mongoSaved, setMongoSaved] = useState<string | null>(null);
  const [mongoResult, setMongoResult] = useState<MongoTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Les secrets restent uniquement en mémoire : aucun token n'est persisté dans le navigateur.
  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return;
    })();
  }, []);

  const saveMongo = async () => {
    if (!apiKey) {
      setMongoResult({ ok: false, stage: "client", error: "Clé API requise au-dessus." });
      return;
    }
    setMongoSaving(true);
    setMongoSaved(null);
    try {
      const r = await fetch("/api/mongo-config", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ url: mongoUrl, token: mongoToken }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string; message?: string };
      if (!r.ok || !j.ok) {
        setMongoResult({ ok: false, stage: "save", error: j.error ?? `HTTP ${r.status}` });
      } else {
        setMongoSaved(j.message ?? "Config enregistrée ✅");
        fetchStatus(apiKey);
      }
    } catch (e) {
      setMongoResult({ ok: false, stage: "save", error: (e as Error).message });
    } finally {
      setMongoSaving(false);
    }
  };

  const testMongo = async () => {
    if (!apiKey) {
      setMongoResult({ ok: false, stage: "client", error: "Clé API requise au-dessus." });
      return;
    }
    setMongoTesting(true);
    setMongoResult(null);
    try {
      const r = await fetch("/api/mongo-test", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ url: mongoUrl, token: mongoToken }),
      });
      const j = (await r.json()) as MongoTestResult;
      setMongoResult(j);
    } catch (e) {
      setMongoResult({ ok: false, stage: "client", error: (e as Error).message });
    } finally {
      setMongoTesting(false);
    }
  };

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
      <section className="relative overflow-hidden border-b pb-6">
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-primary/80 font-mono">
              Stockage
            </p>
            <h1 className="mt-3 font-display text-4xl lg:text-5xl font-semibold ">
              Stockage <span className="italic text-primary">&</span> Intégrations
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Branche tes modèles, ta DB et tes connecteurs IA. Chaque utilisateur dispose de{" "}
              <span className="text-primary font-semibold">1 Go gratuit</span> pour son index DB
              sémantique.
            </p>
          </div>
          <Button
            onClick={() => fetchStatus(apiKey)}
            disabled={!apiKey || loading}
            className="self-start lg:self-auto inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border bg-muted hover:bg-muted text-sm font-medium transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Rafraîchir
          </Button>
        </div>
      </section>

      {/* Clé API input */}
      {!apiKey && (
        <section className="glass rounded-lg p-6 flex flex-col gap-3">
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
              placeholder="sk-aeth-…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 bg-background/50 border border-border rounded-md px-4 py-2 font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchStatus(apiKey);
              }}
            />
          </div>
        </section>
      )}

      {error && <div className="glass rounded-lg p-4 text-sm text-destructive">❌ {error}</div>}

      <HfKeyCard className="glass rounded-lg border-0" />

      {/* Quotas */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QuotaCard
          icon={<HardDrive className="h-5 w-5" />}
          title="Stockage modèles"
          subtitle="Seaweed VPS · GGUF, safetensors, datasets"
          used={status?.storage.bytes ?? -1}
          quota={status?.storage.quota_bytes ?? 50e9}
          pct={usagePct}
          accent="primary"
          objects={status?.storage.objects ?? 0}
        />
        <QuotaCard
          icon={<Database className="h-5 w-5" />}
          title="DB Index"
          subtitle="Index sémantique · 1 Go offert à chaque user"
          used={status?.db_index.bytes ?? -1}
          quota={status?.db_index.quota_bytes ?? 1e9}
          pct={indexPct}
          accent="cyan"
          objects={status?.db_index.objects ?? 0}
          badge="GRATUIT"
        />
      </section>

      {/* Configuration MongoDB Proxy */}
      <section className="glass rounded-lg p-6 lg:p-8 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <PlugZap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">Connecter ton proxy MongoDB</h2>
              <p className="text-xs text-muted-foreground">
                Renseigne l'URL publique et le token <code className="font-mono">PROXY_TOKEN</code>{" "}
                du VPS.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={testMongo}
              disabled={mongoTesting || !mongoUrl || !mongoToken}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-muted hover:bg-muted text-sm font-medium transition disabled:opacity-50"
            >
              {mongoTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlugZap className="h-4 w-4" />
              )}
              Tester
            </Button>
            <Button
              onClick={saveMongo}
              disabled={mongoSaving || !mongoUrl || !mongoToken || !apiKey}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {mongoSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase  text-muted-foreground font-mono">
              MONGO_PROXY_URL
            </span>
            <input
              type="url"
              value={mongoUrl}
              onChange={(e) => setMongoUrl(e.target.value)}
              placeholder="https://mongo.tondomaine.com"
              className="bg-background/50 border border-border rounded-md px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-primary/50"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase  text-muted-foreground font-mono">
              MONGO_PROXY_TOKEN
            </span>
            <input
              type="password"
              value={mongoToken}
              onChange={(e) => setMongoToken(e.target.value)}
              placeholder="64 caractères hex"
              className="bg-background/50 border border-border rounded-md px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-primary/50"
            />
          </label>
        </div>

        <p className="text-xs text-muted-foreground">
          ℹ <strong>Tester</strong> ping le proxy. <strong>Enregistrer</strong> stocke l'URL et le
          token pour ton compte : ils seront utilisés automatiquement dans{" "}
          <code className="font-mono">models</code>,<code className="font-mono"> import</code>,{" "}
          <code className="font-mono">push</code>, <code className="font-mono">rm</code>
          (au lieu du fallback Supabase).
        </p>

        {mongoSaved && (
          <div className="rounded-md border border-success/30 bg-success/10 text-success text-sm px-4 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {mongoSaved}
          </div>
        )}

        {mongoResult && <MongoResultPanel r={mongoResult} />}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl font-semibold ">
            Intégrations actives
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            {integ ? Object.values(integ).filter((i) => i.connected).length : 0} / 4 connectés
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
      <section className="glass rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-semibold">Push un modèle vers ton stockage</h3>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(
                `curl -X PUT "$(aetheris push mistral.gguf)" --data-binary @mistral.gguf`,
              );
            }}
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3 w-3" /> Copier
          </Button>
        </div>
        <pre className="font-mono text-xs bg-background/50 border border-border rounded-md p-4 overflow-x-auto text-muted-foreground">
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
    <div className="relative overflow-hidden glass rounded-lg p-6 group">
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-muted border border-border flex items-center justify-center text-primary">
              {icon}
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {badge && (
            <span className="text-[10px]  font-mono bg-primary/15 text-primary px-2 py-1 rounded-full border border-primary/30">
              {badge}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold ">
              {used < 0 ? "—" : fmtBytes(used)}
            </span>
            <span className="text-sm text-muted-foreground">/ {fmtBytes(quota)}</span>
          </div>
          <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary  transition-all"
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
    <div className="glass rounded-lg p-5 flex flex-col gap-3 hover:border-border transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-muted border border-border flex items-center justify-center">
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
              : "bg-muted text-muted-foreground border-border"
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
      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground border-t border-border pt-3">
        <span>{envKey}</span>
        {tag && (
          <span className="px-2 py-0.5 rounded-full bg-muted text-foreground border border-border">
            {tag}
          </span>
        )}
        {!tag && <ArrowUpRight className="h-3 w-3 opacity-50" />}
      </div>
      {error && <p className="text-[11px] text-destructive font-mono">⚠ {error}</p>}
      {extra && <p className="text-[11px] text-muted-foreground italic">{extra}</p>}
    </div>
  );
}

function MongoResultPanel({ r }: { r: MongoTestResult }) {
  const tone = r.ok ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5";
  return (
    <div className={`rounded-lg border p-4 flex flex-col gap-2 ${tone}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        {r.ok ? (
          <CheckCircle2 className="h-4 w-4 text-primary" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        )}
        {r.ok ? "Connexion réussie" : "Échec de la connexion"}
        <span className="ms-auto text-[10px] font-mono text-muted-foreground">
          stage: {r.stage}
          {r.elapsed_ms !== undefined && ` · ${r.elapsed_ms}ms`}
          {r.status !== undefined && ` · HTTP ${r.status}`}
        </span>
      </div>
      {r.message && <p className="text-sm">{r.message}</p>}
      {r.error && <p className="text-sm text-destructive font-mono break-all">{r.error}</p>}
      {r.hint && <p className="text-xs text-muted-foreground italic">💡 {r.hint}</p>}
      {r.target && (
        <p className="text-[11px] font-mono text-muted-foreground break-all">→ {r.target}</p>
      )}
      {r.body && (
        <pre className="text-[11px] font-mono bg-background/50 border border-border rounded-lg p-2 overflow-x-auto max-h-32 text-muted-foreground">
          {r.body}
        </pre>
      )}
      {r.ok && r.response !== undefined && (
        <pre className="text-[11px] font-mono bg-background/50 border border-border rounded-lg p-2 overflow-x-auto max-h-32 text-muted-foreground">
          {JSON.stringify(r.response, null, 2)}
        </pre>
      )}
    </div>
  );
}
