import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Copy, Check, Trash2, Loader2, KeyRound, ShieldCheck, X } from "lucide-react";

export const Route = createFileRoute("/dashboard/api-keys")({
  head: () => ({
    meta: [{ title: "Clés API — Aetheris" }, { name: "description", content: "Clés API de votre compte Aetheris Cloud." }, { property: "og:title", content: "Clés API — Aetheris" }, { property: "og:description", content: "Clés API de votre compte Aetheris Cloud." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }],
  }),
  component: ApiKeysPage,
});

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: "read_only" | "read_write" | "admin";
  budget_limit_tokens: number | null;
  status: "active" | "revoked" | "expired";
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

const PERM_LABELS = {
  read_only: "Lecture seule",
  read_write: "Lecture + écriture",
  admin: "Toutes",
} as const;

function ApiKeysPage() {
  const { session } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setKeys((data ?? []) as ApiKey[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const revoke = async (id: string) => {
    if (!confirm("Révoquer cette clé ? Cette action est irréversible.")) return;
    const { error } = await supabase.from("api_keys").update({ status: "revoked" }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Clé révoquée");
      void load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer définitivement cette clé ?")) return;
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Clé supprimée");
      void load();
    }
  };

  const copyKey = async () => {
    if (!revealedKey) return;
    await navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    toast.success("Clé copiée");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between px-2">
        <div>
          <h1 className="font-display text-4xl font-light ">Clés API</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Authentifiez vos requêtes API, CLI et SDK.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="px-5 py-3 rounded-lg bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle clé
        </Button>
      </div>

      {/* Table */}
      <div className="glass rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin me-2" /> Chargement...
          </div>
        ) : keys.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase ">
                    Nom
                  </th>
                  <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase ">
                    Préfixe
                  </th>
                  <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase ">
                    Permissions
                  </th>
                  <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase ">
                    Budget
                  </th>
                  <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase ">
                    Dernière utilisation
                  </th>
                  <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase ">
                    Statut
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-5 font-medium">{k.name}</td>
                    <td className="px-4 py-5">
                      <code className="bg-muted px-2 py-1 rounded-lg text-xs font-mono text-primary">
                        {k.key_prefix}…
                      </code>
                    </td>
                    <td className="px-4 py-5 text-sm text-muted-foreground">
                      {PERM_LABELS[k.permissions]}
                    </td>
                    <td className="px-4 py-5 text-sm font-mono">
                      {k.budget_limit_tokens
                        ? `${(k.budget_limit_tokens / 1000).toFixed(0)}k tk`
                        : "Illimité"}
                    </td>
                    <td className="px-4 py-5 text-sm text-muted-foreground">
                      {k.last_used_at
                        ? new Date(k.last_used_at).toLocaleDateString("fr-FR")
                        : "Jamais"}
                    </td>
                    <td className="px-4 py-5">
                      <StatusBadge status={k.status} />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {k.status === "active" && (
                          <Button
                            onClick={() => revoke(k.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors text-xs px-2 py-1 rounded hover:bg-destructive/10"
                            title="Révoquer"
                          >
                            Révoquer
                          </Button>
                        )}
                        <Button
                          onClick={() => remove(k.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded hover:bg-destructive/10"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Test endpoint card */}
      <TestEndpointCard />

      {/* Info card */}
      <div className="glass rounded-lg p-6 flex items-start gap-4 border border-primary/10">
        <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm">
          <p className="font-medium text-foreground">Utilisation depuis votre terminal</p>
          <p className="text-muted-foreground mt-1">
            Une fois votre clé créée, vous pouvez l'utiliser via notre API REST, le CLI ou les SDK
            Python/JS.
          </p>
          <pre className="mt-3 bg-muted border border-border rounded-md px-4 py-3 font-mono text-xs text-primary overflow-x-auto">
            {`curl ${typeof window !== "undefined" ? window.location.origin : "https://app.aetheris.ai"}/api/ai/validate \\
  -H "X-API-Key: ae_live_xxx"`}
          </pre>
        </div>
      </div>

      {/* Modale création */}
      {showCreate && (
        <CreateKeyModal
          accessToken={session?.access_token}
          onClose={() => setShowCreate(false)}
          onCreated={(plain) => {
            setShowCreate(false);
            setRevealedKey(plain);
            void load();
          }}
        />
      )}

      {/* Reveal modal */}
      {revealedKey && (
        <div
          className="fixed inset-0 z-50 bg-muted backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRevealedKey(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-lg p-8 max-w-lg w-full  shadow-elevated"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center ">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold">Votre nouvelle clé</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Conservez-la précieusement.{" "}
              <strong className="text-destructive">Elle ne sera plus jamais affichée.</strong>
            </p>
            <div className="mt-4 bg-muted border border-primary/30 rounded-md p-4 font-mono text-xs text-primary break-all">
              {revealedKey}
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                onClick={copyKey}
                className="flex-1 rounded-md bg-primary text-primary-foreground font-medium px-4 py-3 text-sm  flex items-center justify-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copié" : "Copier la clé"}
              </Button>
              <Button
                onClick={() => setRevealedKey(null)}
                className="px-5 py-3 rounded-md border border-border text-sm hover:bg-muted transition"
              >
                J'ai copié
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TestEndpointCard() {
  const [key, setKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; user_id: string; permissions: string; budget_limit_tokens: number | null }
    | { ok: false; error: string }
    | null
  >(null);

  const test = async () => {
    if (!key.trim()) {
      toast.error("Colle ta clé API d'abord");
      return;
    }
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/validate", {
        headers: { "X-API-Key": key.trim() },
      });
      const json = await res.json();
      if (res.ok) setResult({ ok: true, ...json });
      else setResult({ ok: false, error: json.error ?? "Erreur inconnue" });
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : "Erreur réseau" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="glass rounded-lg p-6 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-lg font-medium">Tester ma clé</h3>
          <p className="text-xs text-muted-foreground">
            Vérifie que ta clé est acceptée par le middleware{" "}
            <code className="font-mono">/api/ai/*</code>
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="ae_live_..."
          className="flex-1 bg-muted border border-border rounded-md px-4 py-3 font-mono text-xs text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
        <Button
          onClick={test}
          disabled={testing}
          className="px-5 py-3 rounded-md bg-foreground text-background font-medium text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Tester
        </Button>
      </div>
      {result && (
        <div
          className={`mt-4 rounded-md p-4 text-sm border ${
            result.ok
              ? "bg-primary/5 border-primary/30 text-primary"
              : "bg-destructive/5 border-destructive/30 text-destructive"
          }`}
        >
          {result.ok ? (
            <div className="space-y-1 font-mono text-xs">
              <div>✓ Clé valide</div>
              <div>user_id: {result.user_id}</div>
              <div>permissions: {result.permissions}</div>
              <div>
                budget:{" "}
                {result.budget_limit_tokens ? `${result.budget_limit_tokens} tk` : "illimité"}
              </div>
            </div>
          ) : (
            <div>✗ {result.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ApiKey["status"] }) {
  const cfg = {
    active: { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary", label: "Actif" },
    revoked: {
      bg: "bg-destructive/10",
      text: "text-destructive",
      dot: "bg-destructive",
      label: "Révoqué",
    },
    expired: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      dot: "bg-muted-foreground",
      label: "Expiré",
    },
  }[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${cfg.bg} ${cfg.text}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="p-16 text-center">
      <div className="mx-auto size-16 rounded-lg bg-muted flex items-center justify-center mb-4">
        <KeyRound className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl font-medium">Aucune clé pour le moment</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Créez votre première clé API pour commencer à utiliser Aetheris.
      </p>
      <Button
        onClick={onCreate}
        className="mt-6 px-5 py-3 rounded-lg bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-all inline-flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Créer une clé
      </Button>
    </div>
  );
}

function CreateKeyModal({
  accessToken,
  onClose,
  onCreated,
}: {
  accessToken?: string;
  onClose: () => void;
  onCreated: (plainKey: string) => void;
}) {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<"read_only" | "read_write" | "admin">(
    "read_write",
  );
  const [budget, setBudget] = useState<string>("");
  const [unlimited, setUnlimited] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nom requis");
      return;
    }
    if (!accessToken) {
      toast.error("Session expirée. Reconnectez-vous.");
      return;
    }
    setSubmitting(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-api-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          permissions,
          budget_limit_tokens: unlimited || !budget ? null : Number(budget) * 1000,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      toast.success("Clé créée");
      onCreated(json.api_key);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-muted backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-lg p-8 max-w-md w-full  shadow-elevated"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-semibold">Nouvelle clé API</h3>
            <p className="text-sm text-muted-foreground mt-1">
              La clé sera affichée une seule fois.
            </p>
          </div>
          <Button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-xs font-medium uppercase  text-muted-foreground">
              Nom de la clé
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="ex: Production backend"
              className="mt-2 w-full rounded-md bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase  text-muted-foreground">
              Permissions
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["read_only", "read_write", "admin"] as const).map((p) => (
                <Button
                  key={p}
                  type="button"
                  onClick={() => setPermissions(p)}
                  className={`px-3 py-2.5 rounded-md text-xs font-medium border transition ${
                    permissions === p
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {PERM_LABELS[p]}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase  text-muted-foreground">
              Budget (en milliers de tokens)
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="number"
                value={budget}
                onChange={(e) => {
                  setBudget(e.target.value);
                  setUnlimited(false);
                }}
                disabled={unlimited}
                min={1}
                placeholder="ex: 100"
                className="flex-1 rounded-md bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={unlimited}
                  onChange={(e) => setUnlimited(e.target.checked)}
                  className="size-4 accent-primary"
                />
                Illimité
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-border px-4 py-3 text-sm hover:bg-muted transition"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-md bg-primary text-primary-foreground font-medium px-4 py-3 text-sm  disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer la clé
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
