import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus,
  Copy,
  Check,
  Trash2,
  Loader2,
  KeyRound,
  ShieldCheck,
  X,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/api-keys")({
  head: () => ({
    meta: [{ title: "Clés API — Aetheris" }],
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
    const { error } = await supabase
      .from("api_keys")
      .update({ status: "revoked" })
      .eq("id", id);
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
          <h1 className="font-display text-4xl font-light tracking-tight">Clés API</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Authentifiez vos requêtes API, CLI et SDK.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-3 rounded-2xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle clé
        </button>
      </div>

      {/* Table */}
      <div className="glass rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Chargement...
          </div>
        ) : keys.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Nom
                  </th>
                  <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Préfixe
                  </th>
                  <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Permissions
                  </th>
                  <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Budget
                  </th>
                  <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Dernière utilisation
                  </th>
                  <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Statut
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5 font-medium">{k.name}</td>
                    <td className="px-4 py-5">
                      <code className="bg-white/5 px-2 py-1 rounded-lg text-xs font-mono text-primary">
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
                          <button
                            onClick={() => revoke(k.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors text-xs px-2 py-1 rounded hover:bg-destructive/10"
                            title="Révoquer"
                          >
                            Révoquer
                          </button>
                        )}
                        <button
                          onClick={() => remove(k.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded hover:bg-destructive/10"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="glass rounded-3xl p-6 flex items-start gap-4 border border-primary/10">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm">
          <p className="font-medium text-foreground">Utilisation depuis votre terminal</p>
          <p className="text-muted-foreground mt-1">
            Une fois votre clé créée, vous pouvez l'utiliser via notre API REST, le CLI ou les
            SDK Python/JS.
          </p>
          <pre className="mt-3 bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-primary overflow-x-auto">
            export AETHERIS_API_KEY=ae_live_xxx
            <br />
            aetheris models list
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
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRevealedKey(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-3xl p-8 max-w-lg w-full border-gradient shadow-elevated"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-glow-cyan">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold">Votre nouvelle clé</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Conservez-la précieusement. <strong className="text-destructive">Elle ne sera plus jamais affichée.</strong>
            </p>
            <div className="mt-4 bg-black/60 border border-primary/30 rounded-xl p-4 font-mono text-xs text-primary break-all">
              {revealedKey}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={copyKey}
                className="flex-1 rounded-xl bg-gradient-primary text-primary-foreground font-medium px-4 py-3 text-sm shadow-glow-cyan flex items-center justify-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copié" : "Copier la clé"}
              </button>
              <button
                onClick={() => setRevealedKey(null)}
                className="px-5 py-3 rounded-xl border border-border text-sm hover:bg-white/5 transition"
              >
                J'ai copié
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ApiKey["status"] }) {
  const cfg = {
    active: { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary", label: "Actif" },
    revoked: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive", label: "Révoqué" },
    expired: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Expiré" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${cfg.bg} ${cfg.text}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="p-16 text-center">
      <div className="mx-auto size-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <KeyRound className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl font-medium">Aucune clé pour le moment</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Créez votre première clé API pour commencer à utiliser Aetheris.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 px-5 py-3 rounded-2xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-all inline-flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Créer une clé
      </button>
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-3xl p-8 max-w-md w-full border-gradient shadow-elevated"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-semibold">Nouvelle clé API</h3>
            <p className="text-sm text-muted-foreground mt-1">
              La clé sera affichée une seule fois.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Nom de la clé
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="ex: Production backend"
              className="mt-2 w-full rounded-xl bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Permissions
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["read_only", "read_write", "admin"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPermissions(p)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition ${
                    permissions === p
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "border-border text-muted-foreground hover:bg-white/5"
                  }`}
                >
                  {PERM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
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
                className="flex-1 rounded-xl bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
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
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm hover:bg-white/5 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-gradient-primary text-primary-foreground font-medium px-4 py-3 text-sm shadow-glow-cyan disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer la clé
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
